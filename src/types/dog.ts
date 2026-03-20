export interface Dog {
  id: string | number;
  "Pet Name": string;
  "Pet Breed": string;
  Weight: string;
  "Current Foster/Adopter": string;
  Gender: string;
  "Age in Years": string;
  "Housebroken?": string;
  Crate: string;
  "Gets along with Kids?": string;
  "Gets along with Cats?": string;
  "Gets along with Dogs?": string;
  "Known Medical": string;
  "Fenced Yard": string;
  "Another dog": string;
  "Photo URL": string;
  /** Vertical crop position 0–100 (0=top, 100=bottom). Default 30. */
  photo_crop_y?: number;
  /** Photo display mode: "fit" shows full photo, "fill" crops to fill frame. Default "fit". */
  photo_mode?: "fit" | "fill";
}

export interface GenerateResult {
  filename: string;
  url: string;
  name: string;
}

export interface BulkGenerateResult {
  results: { name: string; filename?: string; error?: string; success: boolean }[];
  count: number;
  zip_url: string;
  zip_filename: string;
}
