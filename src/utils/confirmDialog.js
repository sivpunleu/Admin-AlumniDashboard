import Swal from "sweetalert2";

export function confirmDelete({
  title = "តើអ្នកប្រាកដទេ?",
  text = "ទិន្នន័យនេះនឹងត្រូវបានលុប។",
  confirmButtonText = "បាទ លុប",
  cancelButtonText = "បោះបង់",
} = {}) {
  return Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
  });
}
