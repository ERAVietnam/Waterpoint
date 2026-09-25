"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NGUON_QUANG_CAO } from "./LeadPopup";

/* Khach bam quang cao (vd ?src=batdongsan) vao trang chu "Thuc te"
   -> tu dong chuyen sang tab GIO HANG truoc, giu nguyen ?src= de
   popup LeadPopup van nhan dien va hien tren tab do. */
export function VaoGioHangNeuCoNguon() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const src = params.get("src");
    if (src && NGUON_QUANG_CAO.some((n) => n.ma === src)) {
      router.replace(`/giohang/?src=${encodeURIComponent(src)}`);
    }
  }, [params, router]);

  return null;
}
