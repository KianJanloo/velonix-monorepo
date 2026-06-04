import {
  Controller, Post, UseGuards, UseInterceptors, UploadedFile,
  BadRequestException, PayloadTooLargeException, Req,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ConfigService } from "@nestjs/config";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/svg+xml": "svg", "image/gif": "gif",
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
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "image/gif";
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && // "RIFF"
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50  // "WEBP"
  ) return "image/webp";
  // SVG is text — accept only if it opens as an XML/SVG document.
  const head = buf.subarray(0, 256).toString("utf8").trimStart().toLowerCase();
  if (head.startsWith("<?xml") || head.startsWith("<svg") || head.startsWith("<!doctype svg")) {
    return "image/svg+xml";
  }
  return null;
}

/** Rejects SVGs carrying active content (script execution, XXE, event handlers). */
function isSafeSvg(buf: Buffer): boolean {
  const s = buf.toString("utf8").toLowerCase();
  if (/<script[\s/>]/.test(s)) return false;             // <script>
  if (/\son\w+\s*=/.test(s)) return false;               // onload=, onclick=, …
  if (/javascript:/.test(s)) return false;               // javascript: URIs
  if (/<foreignobject[\s/>]/.test(s)) return false;      // can embed arbitrary HTML
  if (/<!doctype[^>]*\[|<!entity/.test(s)) return false; // inline DTD / XXE
  return true;
}

@ApiTags("uploads")
@Controller({ path: "uploads", version: "1" })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT")
export class UploadsController {
  constructor(private readonly config: ConfigService) {}

  @Post("image")
  // Tighter than the global limit: 20 uploads per minute per IP.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: MAX_BYTES, files: 1 } }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload an image (max 5MB, jpg/png/webp/svg/gif)" })
  @ApiBody({ schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } })
  async uploadImage(
    @UploadedFile() file: UploadedMulterFile,
    @Req() req: { user: { id: string } },
  ) {
    if (!file?.buffer?.length) throw new BadRequestException("No file provided.");
    if (file.size > MAX_BYTES) throw new PayloadTooLargeException("File too large. Maximum size is 5MB.");

    // Validate by content, not by the client-declared mimetype.
    const type = sniffImageType(file.buffer);
    if (!type) {
      throw new BadRequestException("Unsupported or corrupt image. Use JPG, PNG, WEBP, SVG, or GIF.");
    }
    if (type === "image/svg+xml" && !isSafeSvg(file.buffer)) {
      throw new BadRequestException("This SVG contains active content (scripts/handlers) and was rejected.");
    }

    const dir = join(process.cwd(), "uploads", req.user.id);
    await mkdir(dir, { recursive: true });
    const name = `${randomBytes(12).toString("hex")}.${EXT[type]}`;
    await writeFile(join(dir, name), file.buffer);

    const apiUrl = this.config.get<string>("app.apiUrl") ?? "http://localhost:3001";
    const url = `${apiUrl}/uploads/${req.user.id}/${name}`;
    return { url, filename: name, size: file.size };
  }

  @Post("video")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: MAX_VIDEO_BYTES, files: 1 } }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload a WebM demo video (max 50MB)" })
  @ApiBody({ schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } })
  async uploadVideo(
    @UploadedFile() file: UploadedMulterFile,
    @Req() req: { user: { id: string } },
  ) {
    if (!file?.buffer?.length) throw new BadRequestException("No file provided.");
    if (file.size > MAX_VIDEO_BYTES) throw new PayloadTooLargeException("File too large. Maximum size is 50MB.");

    // WebM/Matroska begins with the EBML header magic bytes.
    const b = file.buffer;
    const isWebm = b.length > 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
    if (!isWebm) throw new BadRequestException("Unsupported video. Only WebM is accepted.");

    const dir = join(process.cwd(), "uploads", req.user.id);
    await mkdir(dir, { recursive: true });
    const name = `${randomBytes(12).toString("hex")}.webm`;
    await writeFile(join(dir, name), file.buffer);

    const apiUrl = this.config.get<string>("app.apiUrl") ?? "http://localhost:3001";
    const url = `${apiUrl}/uploads/${req.user.id}/${name}`;
    return { url, filename: name, size: file.size };
  }
}
