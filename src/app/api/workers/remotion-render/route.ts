import { NextResponse } from "next/server";
import path from "path";
import os from "os";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

export const runtime = "nodejs"; // IMPORTANT (Remotion needs Node runtime)

export async function GET() {
    try {
        // 1) Bundle Remotion project
        const entry = path.join(process.cwd(), "src/remotion/index.ts");

        const bundled = await bundle({
            entryPoint: entry,
            webpackOverride: (config) => config,
        });

        // 2) Select composition
        const composition = await selectComposition({
            serveUrl: bundled,
            id: "AutoReel",
            inputProps: {
                title: "AutoReels AI",
                subtitle: "Rendered via API ✅",
            },
        });

        // 3) Output file
        const outPath = path.join(os.tmpdir(), `autoreel-${Date.now()}.mp4`);

        // 4) Render MP4
        await renderMedia({
            composition,
            serveUrl: bundled,
            codec: "h264",
            outputLocation: outPath,
            inputProps: {
                title: "AutoReels AI",
                subtitle: "Rendered via API ✅",
            },
        });

        return NextResponse.json({
            ok: true,
            message: "Rendered successfully",
            output: outPath,
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json(
            { ok: false, error: err?.message || "Render failed" },
            { status: 500 }
        );
    }
}
