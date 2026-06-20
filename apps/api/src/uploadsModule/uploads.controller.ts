import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  PayloadTooLargeException,
  Query,
  Req,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ConfigService } from "@nestjs/config";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { writeFile, mkdir, readdir, stat } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // 15 MB — voice notes are short clips
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif",
};

interface UploadedMulterFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * Detects the *real* content type from the file's magic bytes. The client-sent
 * mimetype is attacker-controlled and must never be trusted for validation.
 * Returns one of the allowed image types, or null if unrecognised.
 */
function sniffImageType(buf: Buffer): keyof typeof EXT | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38)
    return "image/gif";
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 && // "RIFF"
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50 // "WEBP"
  )
    return "image/webp";
  // SVG is text — accept only if it opens as an XML/SVG document.
  const head = buf.subarray(0, 256).toString("utf8").trimStart().toLowerCase();
  if (
    head.startsWith("<?xml") ||
    head.startsWith("<svg") ||
    head.startsWith("<!doctype svg")
  ) {
    return "image/svg+xml";
  }
  return null;
}

/** Rejects SVGs carrying active content (script execution, XXE, event handlers). */
function isSafeSvg(buf: Buffer): boolean {
  const s = buf.toString("utf8").toLowerCase();
  if (/<script[\s/>]/.test(s)) return false; // <script>
  if (/\son\w+\s*=/.test(s)) return false; // onload=, onclick=, …
  if (/javascript:/.test(s)) return false; // javascript: URIs
  if (/<foreignobject[\s/>]/.test(s)) return false; // can embed arbitrary HTML
  if (/<!doctype[^>]*\[|<!entity/.test(s)) return false; // inline DTD / XXE
  return true;
}

/**
 * Detects voice-note audio formats by magic bytes (never trust the client
 * mimetype). Covers what MediaRecorder actually produces across browsers:
 * WebM/Opus (Chrome, Firefox), MP4/AAC (Safari), plus MP3/WAV for re-uploads.
 */
function sniffAudioType(buf: Buffer): { ext: string } | null {
  if (buf.length < 12) return null;
  // WebM/Matroska — EBML header
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3)
    return { ext: "webm" };
  // MP4/M4A — "ftyp" box at offset 4
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70)
    return { ext: "m4a" };
  // MP3 — ID3 tag, or a frame sync (0xFFFB/0xFFFA/0xFFF3/0xFFF2)
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33)
    return { ext: "mp3" };
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return { ext: "mp3" };
  // WAV — "RIFF"...."WAVE"
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x41 &&
    buf[10] === 0x56 &&
    buf[11] === 0x45
  )
    return { ext: "wav" };
  return null;
}

@ApiTags("uploads")
@Controller({ path: "uploads", version: "1" })
export class UploadsController {
  constructor(private readonly config: ConfigService) {}

  @Get("admin/list")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "List all uploaded files (admin)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "perPage", required: false, type: Number })
  async adminList(
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const pp = perPage ? parseInt(perPage, 10) : 50;
    const uploadsDir = join(process.cwd(), "uploads");
    const files: { userId: string; filename: string; size: number; url: string }[] = [];

    try {
      const userDirs = await readdir(uploadsDir, { withFileTypes: true });
      for (const dir of userDirs) {
        if (!dir.isDirectory()) continue;
        const userUploadsDir = join(uploadsDir, dir.name);
        const entries = await readdir(userUploadsDir);
        for (const filename of entries) {
          const filePath = join(userUploadsDir, filename);
          const fileStat = await stat(filePath);
          if (!fileStat.isFile()) continue;
          const apiUrl = this.config.get<string>("app.apiUrl") ?? "http://localhost:3001";
          files.push({
            userId: dir.name,
            filename,
            size: fileStat.size,
            url: `${apiUrl}/uploads/${dir.name}/${filename}`,
          });
        }
      }
    } catch {
      // Uploads directory may not exist yet
    }

    files.sort((a, b) => b.size - a.size);
    const total = files.length;
    const data = files.slice((p - 1) * pp, p * pp);

    return { data, total, page, perPage: pp, totalPages: Math.ceil(total / pp) || 1 };
  }

  @Post("image")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")

  @Post("image")
  // Tighter than the global limit: 20 uploads per minute per IP.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: MAX_BYTES, files: 1 } }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload an image (max 5MB, jpg/png/webp/svg/gif)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  async uploadImage(
    @UploadedFile() file: UploadedMulterFile,
    @Req() req: { user: { id: string } },
  ) {
    if (!file?.buffer?.length)
      throw new BadRequestException("No file provided.");
    if (file.size > MAX_BYTES)
      throw new PayloadTooLargeException(
        "File too large. Maximum size is 5MB.",
      );

    // Validate by content, not by the client-declared mimetype.
    const type = sniffImageType(file.buffer);
    if (!type) {
      throw new BadRequestException(
        "Unsupported or corrupt image. Use JPG, PNG, WEBP, SVG, or GIF.",
      );
    }
    if (type === "image/svg+xml" && !isSafeSvg(file.buffer)) {
      throw new BadRequestException(
        "This SVG contains active content (scripts/handlers) and was rejected.",
      );
    }

    const dir = join(process.cwd(), "uploads", req.user.id);
    await mkdir(dir, { recursive: true });
    const name = `${randomBytes(12).toString("hex")}.${EXT[type]}`;
    await writeFile(join(dir, name), file.buffer);

    const apiUrl =
      this.config.get<string>("app.apiUrl") ?? "http://localhost:3001";
    const url = `${apiUrl}/uploads/${req.user.id}/${name}`;
    return { url, filename: name, size: file.size };
  }

  @Post("video")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_VIDEO_BYTES, files: 1 },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload a WebM demo video (max 50MB)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  async uploadVideo(
    @UploadedFile() file: UploadedMulterFile,
    @Req() req: { user: { id: string } },
  ) {
    if (!file?.buffer?.length)
      throw new BadRequestException("No file provided.");
    if (file.size > MAX_VIDEO_BYTES)
      throw new PayloadTooLargeException(
        "File too large. Maximum size is 50MB.",
      );

    // WebM/Matroska begins with the EBML header magic bytes.
    const b = file.buffer;
    const isWebm =
      b.length > 4 &&
      b[0] === 0x1a &&
      b[1] === 0x45 &&
      b[2] === 0xdf &&
      b[3] === 0xa3;
    if (!isWebm)
      throw new BadRequestException(
        "Unsupported video. Only WebM is accepted.",
      );

    const dir = join(process.cwd(), "uploads", req.user.id);
    await mkdir(dir, { recursive: true });
    const name = `${randomBytes(12).toString("hex")}.webm`;
    await writeFile(join(dir, name), file.buffer);

    const apiUrl =
      this.config.get<string>("app.apiUrl") ?? "http://localhost:3001";
    const url = `${apiUrl}/uploads/${req.user.id}/${name}`;
    return { url, filename: name, size: file.size };
  }

  @Post("audio")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_AUDIO_BYTES, files: 1 },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Upload a voice-note recording (max 15MB, webm/mp4/mp3/wav)",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  async uploadAudio(
    @UploadedFile() file: UploadedMulterFile,
    @Req() req: { user: { id: string } },
  ) {
    if (!file?.buffer?.length)
      throw new BadRequestException("No file provided.");
    if (file.size > MAX_AUDIO_BYTES)
      throw new PayloadTooLargeException(
        "File too large. Maximum size is 15MB.",
      );

    const sniffed = sniffAudioType(file.buffer);
    if (!sniffed) {
      throw new BadRequestException(
        "Unsupported or corrupt audio. Record with the browser's microphone tool.",
      );
    }

    const dir = join(process.cwd(), "uploads", req.user.id);
    await mkdir(dir, { recursive: true });
    const name = `${randomBytes(12).toString("hex")}.${sniffed.ext}`;
    await writeFile(join(dir, name), file.buffer);

    const apiUrl =
      this.config.get<string>("app.apiUrl") ?? "http://localhost:3001";
    const url = `${apiUrl}/uploads/${req.user.id}/${name}`;
    return { url, filename: name, size: file.size };
  }
}
