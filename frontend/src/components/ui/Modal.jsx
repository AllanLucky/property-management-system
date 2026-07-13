export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[400px] rounded-lg p-4 relative">
        
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500"
        >
          ✕
        </button>

        {title && (
          <h2 className="text-lg font-bold mb-3">{title}</h2>
        )}

        {children}
      </div>
    </div>
  );
}