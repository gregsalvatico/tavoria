// Web-only media pickers. Uses a hidden HTML <input type="file"> with the
// `capture` attribute so on a phone browser, tapping "Take photo" / "Record
// video" opens the device camera directly. On desktop the `capture` hint is
// ignored and the regular file picker opens.
//
// Callers MUST guard with `Platform.OS === "web"` before importing/calling.
// Return shape mirrors expo-image-picker so callers can plug it in without
// reshaping result handling code.

export type WebPickResult = {
  canceled: boolean;
  assets: Array<{ uri: string; duration?: number }>;
};

type PickOpts = {
  // "user" = front camera (selfie), "environment" = back camera.
  // false / omit = no capture hint (file picker only).
  camera?: "user" | "environment" | false;
};

export function pickImageWeb(opts: PickOpts = {}): Promise<WebPickResult> {
  return openPickerWeb("image/*", opts);
}

export function pickVideoWeb(opts: PickOpts = {}): Promise<WebPickResult> {
  return openPickerWeb("video/*", opts);
}

function openPickerWeb(
  accept: string,
  opts: PickOpts
): Promise<WebPickResult> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    if (opts.camera) {
      // Browsers that don't support `capture` ignore it silently.
      input.setAttribute("capture", opts.camera);
    }
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.opacity = "0";

    const cleanup = () => {
      if (input.parentNode) input.parentNode.removeChild(input);
    };

    // Cancel — modern browsers fire an `cancel` event when the dialog is
    // dismissed without a file. Older browsers don't, but onchange also
    // won't fire so the promise just stays pending until the calling
    // component is re-mounted. That's acceptable for our flows.
    input.addEventListener("cancel", () => {
      cleanup();
      resolve({ canceled: true, assets: [] });
    });

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        cleanup();
        resolve({ canceled: true, assets: [] });
        return;
      }

      if (accept.startsWith("video/")) {
        // Videos: hand back the raw file. Probe for duration.
        const uri = URL.createObjectURL(file);
        const asset: { uri: string; duration?: number } = { uri };
        const v = document.createElement("video");
        v.preload = "metadata";
        let resolved = false;
        const finish = () => {
          if (resolved) return;
          resolved = true;
          cleanup();
          resolve({ canceled: false, assets: [asset] });
        };
        v.onloadedmetadata = () => {
          asset.duration = Math.round(v.duration * 1000);
          finish();
        };
        v.onerror = finish;
        v.src = uri;
        setTimeout(finish, 2000);
        return;
      }

      // Images: bake EXIF rotation into the pixels so the photo displays
      // upright everywhere, regardless of the renderer's EXIF support.
      // iPhone selfies store landscape pixel data + "rotate 90°" metadata;
      // React Native Web's <Image> ignores the metadata and shows the
      // image sideways. createImageBitmap with imageOrientation lets the
      // browser apply the rotation; we then re-encode through a canvas.
      try {
        const bmp = await createImageBitmap(file, {
          imageOrientation: "from-image",
        });
        const canvas = document.createElement("canvas");
        canvas.width = bmp.width;
        canvas.height = bmp.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas 2d context unavailable");
        ctx.drawImage(bmp, 0, 0);
        // @ts-ignore — bitmap.close exists in supporting browsers
        bmp.close?.();
        const outType =
          file.type === "image/png" ? "image/png" : "image/jpeg";
        const blob: Blob | null = await new Promise((res) =>
          canvas.toBlob(res, outType, 0.85)
        );
        if (!blob) throw new Error("canvas.toBlob returned null");
        const uri = URL.createObjectURL(blob);
        cleanup();
        resolve({ canceled: false, assets: [{ uri }] });
      } catch (err) {
        // Fallback: just hand back the raw file URI. Display may be
        // rotated on older browsers, but at least the upload succeeds.
        console.warn("[webMedia] EXIF orientation fix failed:", err);
        const uri = URL.createObjectURL(file);
        cleanup();
        resolve({ canceled: false, assets: [{ uri }] });
      }
    };

    document.body.appendChild(input);
    input.click();
  });
}
