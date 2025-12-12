import toast, { Toast } from "react-hot-toast";
import { CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";

toast.remove();

toast.success("init", {
  style: { display: "none" },
});
toast.dismiss();

const baseStyle = (t: Toast) => ({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px solid var(--card-border)",
  boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
  fontSize: "15px",
  fontWeight: 500,

  transform: t.visible ? "translateY(-12px)" : "translateY(0px)",
  opacity: t.visible ? 1 : 0,
  transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
});

// SUCCESS TOAST
export function successToast(msg: string) {
  toast.custom((t: Toast) => (
    <div
      style={{
        ...baseStyle(t),
        background: "linear-gradient(135deg, #ffe36e, #ffd000)",
        border: "1px solid #f5c400",
        color: "#000",
      }}
    >
      <CheckCircle size={22} />
      <span>{msg}</span>
    </div>
  ));
}

// ERROR TOAST
export function errorToast(msg: string) {
  toast.custom((t: Toast) => (
    <div
      style={{
        ...baseStyle(t),
        background: "#ffe5e5",
        border: "1px solid #ffbaba",
        color: "#b00000",
      }}
    >
      <XCircle size={22} />
      <span>{msg}</span>
    </div>
  ));
}

// INFO TOAST
export function infoToast(msg: string) {
  toast.custom((t: Toast) => (
    <div
      style={{
        ...baseStyle(t),
        background: "var(--bg-soft)",
        border: "1px solid var(--card-border)",
        color: "var(--text)",
      }}
    >
      <Info size={22} />
      <span>{msg}</span>
    </div>
  ));
}

// WARNING TOAST
export function warnToast(msg: string) {
  toast.custom((t: Toast) => (
    <div
      style={{
        ...baseStyle(t),
        background: "#fff6e0",
        border: "1px solid #ffdd99",
        color: "#b96d00",
      }}
    >
      <AlertTriangle size={22} />
      <span>{msg}</span>
    </div>
  ));
}
