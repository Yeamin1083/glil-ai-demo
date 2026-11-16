import { useEffect, useState } from "react";

// created inside the effect so StrictMode's mount/cleanup/mount cycle never leaves a revoked URL behind
export function useObjectUrl(file: File) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}
