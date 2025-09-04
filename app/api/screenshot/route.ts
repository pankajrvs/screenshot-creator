import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  url: z.string().url(),
  fullPage: z.boolean().optional().default(true),
  viewport: z.object({
    width: z.number().int().min(320).max(4096).default(1366),
    height: z.number().int().min(320).max(4096).default(768),
  }).optional(),
  imageType: z.enum(["png", "jpeg"]).optional().default("png"),
  blockConsentModals: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, fullPage, viewport, imageType, blockConsentModals } = BodySchema.parse(body);
    const baseUrl = process.env.BROWSERLESS_BASE_URL;
    const token = process.env.BROWSERLESS_TOKEN;

    if (!baseUrl || !token) {
      return NextResponse.json({ error: "Browserless configuration missing" }, { status: 500 });
    }

    const blRes = await fetch(`${baseUrl}/screenshot?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        options: { fullPage, type: "png" },
        viewport: viewport ?? { width: 1366, height: 768 },
      }),
    });

    if (!blRes.ok) {
      const text = await blRes.text().catch(() => "");
      return NextResponse.json(
        { error: "Browserless failed", details: text || blRes.statusText },
        { status: 502 }
      );
    }

    const arrayBuffer = await blRes.arrayBuffer();
    const screenshotBuffer = Buffer.from(arrayBuffer);

    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "screenshots", resource_type: "image", format: imageType },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(screenshotBuffer);
    });

    return NextResponse.json({
      url: uploadResult.secure_url as string,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes,
      public_id: uploadResult.public_id,
      format: uploadResult.format,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Unexpected server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
