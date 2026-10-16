import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import type { BlogPostMetadata, BlogPostText } from "@/types/blog";

export const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function invalid(filename: string, message: string): never {
  throw new Error(`Blog file "${filename}": ${message}`);
}

export function readText(data: Record<string, unknown>, filename: string): BlogPostText {
  if (
    typeof data.title !== "string" ||
    !data.title.trim() ||
    typeof data.description !== "string" ||
    !data.description.trim()
  ) {
    invalid(filename, "title and description must be nonempty strings.");
  }
  if (
    data.tags !== undefined &&
    (!Array.isArray(data.tags) || data.tags.some((tag) => typeof tag !== "string" || !tag.trim()))
  ) {
    invalid(filename, "tags must be an array of nonempty strings.");
  }
  return { title: data.title, description: data.description, tags: (data.tags ?? []) as string[] };
}

export function readDate(
  value: unknown,
  filename: string,
  field: string,
  required: boolean,
): string | undefined {
  if (value === undefined && !required) return undefined;
  const date =
    value instanceof Date && !Number.isNaN(value.valueOf())
      ? value.toISOString().slice(0, 10)
      : value;
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
  ) {
    invalid(
      filename,
      `${field} must be a valid YYYY-MM-DD date${field === "date" && required ? " (required for articles)" : ""}.`,
    );
  }
  return date;
}

export function readMetadata(data: Record<string, unknown>, filename: string): BlogPostMetadata {
  const slug = data.slug;
  if (typeof slug !== "string" || !validSlug.test(slug))
    invalid(filename, "slug is required and must contain lowercase words separated by hyphens.");
  const text = readText(data, filename);
  const type = data.type === undefined ? "article" : data.type;
  if (type !== "project" && type !== "article")
    invalid(filename, "type must be project or article.");
  const date = readDate(data.date, filename, "date", type === "article");
  const updated = readDate(data.updated, filename, "updated", false);
  if (updated && (!date || updated < date))
    invalid(filename, "updated requires a publication date and cannot be earlier than date.");

  if (data.featured !== undefined && typeof data.featured !== "boolean")
    invalid(filename, "featured must be true or false.");

  const image = data.image;
  if (
    image !== undefined &&
    (typeof image !== "string" ||
      !image.startsWith("/images/") ||
      path.posix.normalize(image) !== image)
  ) {
    invalid(filename, "image must be a local /images/ path without traversal segments.");
  }
  let dimensions: { width: number; height: number } | undefined;
  if (typeof image === "string") {
    const imagePath = path.join(process.cwd(), "public", image);
    if (!fs.existsSync(imagePath) || !fs.statSync(imagePath).isFile())
      invalid(filename, `image must reference an existing file: ${image}.`);
    try {
      const { width, height, orientation } = imageSize(fs.readFileSync(imagePath));
      // JPEG dimensions must match the orientation browsers actually display.
      dimensions =
        orientation && orientation >= 5 ? { width: height, height: width } : { width, height };
    } catch {
      invalid(
        filename,
        `image dimensions could not be read: ${image}. Use a supported raster image with valid dimensions.`,
      );
    }
  }

  const projectUrl = data.projectUrl;
  if (projectUrl !== undefined) {
    if (
      typeof projectUrl !== "string" ||
      !URL.canParse(projectUrl) ||
      !["https:", "http:"].includes(new URL(projectUrl).protocol)
    ) {
      invalid(filename, "projectUrl must be an absolute HTTP or HTTPS URL.");
    }
  }
  if (type === "project" && (!image || !projectUrl))
    invalid(filename, "project posts require image and projectUrl.");

  return {
    ...text,
    slug,
    type,
    date,
    ...(updated ? { updated } : {}),
    ...(image !== undefined ? { image: image as string } : {}),
    ...(dimensions ? { imageWidth: dimensions.width, imageHeight: dimensions.height } : {}),
    ...(projectUrl !== undefined ? { projectUrl: projectUrl as string } : {}),
    ...(data.featured !== undefined ? { featured: data.featured as boolean } : {}),
  };
}
