export interface FileBase64Payload {
  filename: string;
  contentType: string;
  data: string;
}

/**
 * Read a browser File into the base64 payload shape the email-server's upload
 * endpoints expect. Strips the data: URL prefix.
 */
export function fileToBase64Input(file: File): Promise<FileBase64Payload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const comma = dataUrl.indexOf(",");
      const data = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
      resolve({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        data,
      });
    };
    reader.readAsDataURL(file);
  });
}
