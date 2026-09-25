import { Suspense } from "react";
import { WaterpointFrame } from "@/components/sections/waterpoint/WaterpointFrame";
import { VaoGioHangNeuCoNguon } from "@/components/sections/waterpoint/VaoGioHangNeuCoNguon";

/* TAB "Thuc te" - trang chu: 7 canh flycam that 360°.
   Neu khach den tu nguon quang cao (?src=...) -> tu chuyen sang tab Gio hang. */
export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <VaoGioHangNeuCoNguon />
      </Suspense>
      <WaterpointFrame src="/waterpoint/index.html" title="Waterpoint - Thực tế 360°" />
    </>
  );
}
