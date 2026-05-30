const path = require("path");
const resolve = require("resolve");
const fs = require("fs");

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "postcss-import": {
      resolve(id, baseDir) {
        // Handle bare package imports with exports field support
        if (
          id.startsWith("@") ||
          (!id.startsWith(".") && !id.startsWith("/"))
        ) {
          const [scope, name, ...rest] = id.startsWith("@")
            ? id.slice(1).split("/")
            : [null, ...id.split("/")];
          const pkg = id.startsWith("@")
            ? `@${scope}/${name}`
            : (scope ?? name ?? id);
          const subpath = rest.length ? rest.join("/") : null;

          try {
            const pkgDir = path.dirname(
              resolve.sync(`${pkg}/package.json`, { basedir: baseDir }),
            );
            const pkgJson = JSON.parse(
              fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"),
            );
            // Resolve via exports field
            if (subpath && pkgJson.exports) {
              const exportsKey = `./${subpath}`;
              const exportsEntry = pkgJson.exports[exportsKey];
              if (typeof exportsEntry === "string") {
                return path.join(pkgDir, exportsEntry);
              }
            }
            // Fallback: try direct file
            if (subpath) return path.join(pkgDir, subpath);
            return pkgDir;
          } catch {
            // fallthrough to default resolver
          }
        }
        return id;
      },
    },
    tailwindcss: {},
    autoprefixer: {},
  },
};

module.exports = config;
