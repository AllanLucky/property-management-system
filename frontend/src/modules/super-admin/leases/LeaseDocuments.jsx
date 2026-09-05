import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { useLease } from "../../../hooks/useLease";

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
];

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Convert a value into a readable string.
 */
const normalizeString = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
};

/**
 * Extract a useful API error message.
 */
const getErrorMessage = (
  error,
  fallback = "Unable to complete document action."
) => {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  /*
  |--------------------------------------------------------------------------
  | Service-normalized errors
  |--------------------------------------------------------------------------
  */

  if (
    typeof error?.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  /*
  |--------------------------------------------------------------------------
  | Axios response
  |--------------------------------------------------------------------------
  */

  const responseData =
    error?.response?.data;

  if (
    typeof responseData?.message === "string" &&
    responseData.message.trim()
  ) {
    return responseData.message;
  }

  if (
    typeof responseData?.error === "string" &&
    responseData.error.trim()
  ) {
    return responseData.error;
  }

  /*
  |--------------------------------------------------------------------------
  | Laravel validation errors
  |--------------------------------------------------------------------------
  */

  if (
    responseData?.errors &&
    typeof responseData.errors === "object"
  ) {
    const messages = Object.values(
      responseData.errors
    )
      .flat()
      .filter(Boolean)
      .map(String);

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Generic fallback
  |--------------------------------------------------------------------------
  */

  return fallback;
};

/**
 * Extract a filename from a path or URL.
 */
const getFileNameFromPath = (
  path
) => {
  if (!path) {
    return "";
  }

  const cleanPath = String(path)
    .split("?")[0]
    .split("#")[0];

  const parts = cleanPath.split("/");

  return (
    parts[parts.length - 1] ||
    "Lease document"
  );
};

/**
 * Format file size for display.
 */
const formatFileSize = (
  bytes
) => {
  const size = Number(bytes);

  if (!Number.isFinite(size) || size <= 0) {
    return "0 KB";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
};

/**
 * Get a file extension.
 */
const getFileExtension = (
  fileName
) => {
  if (!fileName) {
    return "";
  }

  const normalized =
    String(fileName)
      .trim()
      .toLowerCase();

  const lastDot =
    normalized.lastIndexOf(".");

  if (lastDot === -1) {
    return "";
  }

  return normalized.substring(
    lastDot
  );
};

/**
 * Validate an uploaded document.
 */
const validateDocument = (
  file
) => {
  if (!file) {
    return "Please select a document.";
  }

  const extension =
    getFileExtension(file.name);

  const validMimeType =
    ALLOWED_FILE_TYPES.includes(
      file.type
    );

  const validExtension =
    ALLOWED_EXTENSIONS.includes(
      extension
    );

  if (
    !validMimeType &&
    !validExtension
  ) {
    return "Invalid document type. Please upload a PDF, DOC, or DOCX file.";
  }

  if (
    Number(file.size) >
    MAX_FILE_SIZE
  ) {
    return "The document must not exceed 10 MB.";
  }

  if (
    Number(file.size) <= 0
  ) {
    return "The selected document is empty.";
  }

  return null;
};

/**
 * Resolve the existing document path.
 */
const getDocumentPath = (
  lease
) => {
  return normalizeString(
    lease?.document_path ||
    lease?.document_url ||
    lease?.document ||
    lease?.document?.path ||
    lease?.document?.url
  );
};

/**
 * Resolve a document URL.
 *
 * Supports:
 * - Absolute URLs
 * - Relative storage paths
 * - Laravel storage URLs
 */
const getDocumentUrl = (
  path
) => {
  if (!path) {
    return "";
  }

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  if (path.startsWith("/")) {
    return path;
  }

  return `/${path}`;
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function LeaseDocuments({
  lease = null,
  showHeader = true,
  showExistingDocument = true,
  showUpload = true,
  showDelete = true,
  compact = false,
  className = "",
  onSuccess,
  onError,
}) {
  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [fileError, setFileError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [dragActive, setDragActive] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | FILE INPUT REF
  |--------------------------------------------------------------------------
  */

  const fileInputRef =
    useRef(null);

  /*
  |--------------------------------------------------------------------------
  | LEASE HOOK
  |--------------------------------------------------------------------------
  */

  const {
    uploadDocument,
    deleteDocument,
    loadingDocument,
  } = useLease();

  /*
  |--------------------------------------------------------------------------
  | DERIVED VALUES
  |--------------------------------------------------------------------------
  */

  const leaseId = lease?.id;

  const documentPath =
    getDocumentPath(lease);

  const documentUrl =
    getDocumentUrl(documentPath);

  const existingDocumentName =
    getFileNameFromPath(
      documentPath
    );

  const isUploading =
    loadingDocument === true;

  /*
  |--------------------------------------------------------------------------
  | RESET MESSAGES
  |--------------------------------------------------------------------------
  */

  const clearMessages =
    useCallback(() => {
      setFileError("");
      setActionError("");
      setSuccessMessage("");
    }, []);

  /*
  |--------------------------------------------------------------------------
  | HANDLE FILE
  |--------------------------------------------------------------------------
  */

  const handleFile = useCallback(
    (file) => {
      clearMessages();

      if (!file) {
        setSelectedFile(null);
        return;
      }

      const validationError =
        validateDocument(file);

      if (validationError) {
        setSelectedFile(null);
        setFileError(
          validationError
        );

        return;
      }

      setSelectedFile(file);
    },
    [clearMessages]
  );

  /*
  |--------------------------------------------------------------------------
  | FILE INPUT
  |--------------------------------------------------------------------------
  */

  const handleFileInputChange =
    useCallback(
      (event) => {
        const file =
          event.target.files?.[0] ||
          null;

        handleFile(file);
      },
      [handleFile]
    );

  /*
  |--------------------------------------------------------------------------
  | DRAG EVENTS
  |--------------------------------------------------------------------------
  */

  const handleDragOver =
    useCallback(
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!isUploading) {
          setDragActive(true);
        }
      },
      [isUploading]
    );

  const handleDragLeave =
    useCallback((event) => {
      event.preventDefault();
      event.stopPropagation();

      setDragActive(false);
    }, []);

  const handleDrop =
    useCallback(
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        setDragActive(false);

        if (isUploading) {
          return;
        }

        const file =
          event.dataTransfer?.files?.[0] ||
          null;

        handleFile(file);
      },
      [handleFile, isUploading]
    );

  /*
  |--------------------------------------------------------------------------
  | OPEN FILE PICKER
  |--------------------------------------------------------------------------
  */

  const openFilePicker =
    useCallback(() => {
      if (isUploading) {
        return;
      }

      fileInputRef.current?.click();
    }, [isUploading]);

  /*
  |--------------------------------------------------------------------------
  | REMOVE SELECTED FILE
  |--------------------------------------------------------------------------
  */

  const removeSelectedFile =
    useCallback(() => {
      if (isUploading) {
        return;
      }

      setSelectedFile(null);
      setFileError("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }, [isUploading]);

  /*
  |--------------------------------------------------------------------------
  | UPLOAD DOCUMENT
  |--------------------------------------------------------------------------
  */

  const handleUpload =
    useCallback(async () => {
      clearMessages();

      if (!leaseId) {
        const message =
          "A valid lease is required before uploading a document.";

        setActionError(message);

        if (
          typeof onError === "function"
        ) {
          onError({
            action: "upload",
            lease,
            message,
          });
        }

        return;
      }

      if (!selectedFile) {
        setFileError(
          "Please select a document before uploading."
        );

        return;
      }

      const validationError =
        validateDocument(
          selectedFile
        );

      if (validationError) {
        setFileError(
          validationError
        );

        return;
      }

      const formData =
        new FormData();

      formData.append(
        "document",
        selectedFile
      );

      try {
        const response =
          await uploadDocument(
            leaseId,
            formData
          );

        const message =
          response?.message ||
          "Lease document uploaded successfully.";

        setSuccessMessage(
          message
        );

        setSelectedFile(null);

        if (fileInputRef.current) {
          fileInputRef.current.value =
            "";
        }

        if (
          typeof onSuccess === "function"
        ) {
          onSuccess({
            action: "upload",
            lease,
            response,
            file: selectedFile,
          });
        }
      } catch (error) {
        console.error(
          "Lease document upload failed:",
          error
        );

        const message =
          getErrorMessage(
            error,
            "Unable to upload the lease document."
          );

        setActionError(
          message
        );

        if (
          typeof onError === "function"
        ) {
          onError({
            action: "upload",
            lease,
            error,
            message,
          });
        }
      }
    }, [
      clearMessages,
      lease,
      leaseId,
      onError,
      onSuccess,
      selectedFile,
      uploadDocument,
    ]);

  /*
  |--------------------------------------------------------------------------
  | DELETE DOCUMENT
  |--------------------------------------------------------------------------
  */

  const handleDelete =
    useCallback(async () => {
      clearMessages();

      if (!leaseId) {
        const message =
          "A valid lease is required.";

        setActionError(message);

        return;
      }

      if (!documentPath) {
        setActionError(
          "No lease document is available to delete."
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Delete the document "${existingDocumentName}"?\n\nThis action cannot be undone.`
        );

      if (!confirmed) {
        return;
      }

      try {
        const response =
          await deleteDocument(
            leaseId
          );

        const message =
          response?.message ||
          "Lease document deleted successfully.";

        setSuccessMessage(
          message
        );

        if (
          typeof onSuccess === "function"
        ) {
          onSuccess({
            action: "delete",
            lease,
            response,
          });
        }
      } catch (error) {
        console.error(
          "Lease document deletion failed:",
          error
        );

        const message =
          getErrorMessage(
            error,
            "Unable to delete the lease document."
          );

        setActionError(
          message
        );

        if (
          typeof onError === "function"
        ) {
          onError({
            action: "delete",
            lease,
            error,
            message,
          });
        }
      }
    }, [
      clearMessages,
      deleteDocument,
      documentPath,
      existingDocumentName,
      lease,
      leaseId,
      onError,
      onSuccess,
    ]);

  /*
  |--------------------------------------------------------------------------
  | KEYBOARD ACCESS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleKeyDown =
      (event) => {
        if (
          event.key === "Escape" &&
          selectedFile &&
          !isUploading
        ) {
          removeSelectedFile();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    isUploading,
    removeSelectedFile,
    selectedFile,
  ]);

  /*
  |--------------------------------------------------------------------------
  | INVALID LEASE
  |--------------------------------------------------------------------------
  */

  if (!leaseId) {
    return (
      <div
        className={[
          "rounded-xl border border-red-200 bg-red-50 p-4",
          className,
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <p className="text-sm font-semibold text-red-800">
              Lease unavailable
            </p>

            <p className="mt-1 text-sm text-red-700">
              A valid lease is required to
              manage lease documents.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <section
      className={[
        "rounded-2xl border border-gray-200 bg-white shadow-sm",
        className,
      ].join(" ")}
    >
      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}

      {showHeader && (
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Lease Documents
              </h2>

              <p className="mt-0.5 text-sm text-gray-500">
                Upload and manage the lease agreement document.
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className={
          compact
            ? "space-y-4 p-4"
            : "space-y-5 p-5"
        }
      >
        {/* ================================================================== */}
        {/* SUCCESS MESSAGE */}
        {/* ================================================================== */}

        {successMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-green-800">
                Success
              </p>

              <p className="mt-1 text-sm text-green-700">
                {successMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSuccessMessage("")
              }
              className="rounded-lg p-1 text-green-600 transition hover:bg-green-100"
              aria-label="Dismiss success message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ================================================================== */}
        {/* ERROR MESSAGE */}
        {/* ================================================================== */}

        {(fileError ||
          actionError) && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-red-800">
                  Document error
                </p>

                <p className="mt-1 text-sm leading-5 text-red-700">
                  {fileError ||
                    actionError}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFileError("");
                  setActionError("");
                }}
                className="rounded-lg p-1 text-red-600 transition hover:bg-red-100"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

        {/* ================================================================== */}
        {/* EXISTING DOCUMENT */}
        {/* ================================================================== */}

        {showExistingDocument &&
          documentPath && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Current document
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                    {existingDocumentName}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {documentUrl && (
                      <a
                        href={documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                      >
                        <Download className="h-4 w-4" />
                        Open Document
                      </a>
                    )}

                    {showDelete && (
                      <button
                        type="button"
                        onClick={
                          handleDelete
                        }
                        disabled={
                          isUploading
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}

                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* ================================================================== */}
        {/* UPLOAD */}
        {/* ================================================================== */}

        {showUpload && (
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Upload document
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Supported formats: PDF, DOC and DOCX.
                Maximum size: 10 MB.
              </p>
            </div>

            {/* -------------------------------------------------------------- */}
            {/* HIDDEN FILE INPUT */}
            {/* -------------------------------------------------------------- */}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={
                handleFileInputChange
              }
              disabled={isUploading}
              className="hidden"
            />

            {/* -------------------------------------------------------------- */}
            {/* DROP ZONE */}
            {/* -------------------------------------------------------------- */}

            {!selectedFile ? (
              <button
                type="button"
                onClick={openFilePicker}
                onDragOver={
                  handleDragOver
                }
                onDragLeave={
                  handleDragLeave
                }
                onDrop={
                  handleDrop
                }
                disabled={isUploading}
                className={[
                  "flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition",
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                ].join(" ")}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  ) : (
                    <Upload className="h-6 w-6 text-blue-600" />
                  )}
                </div>

                <p className="mt-4 text-sm font-semibold text-gray-900">
                  {isUploading
                    ? "Uploading document..."
                    : "Click to upload or drag and drop"}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  PDF, DOC or DOCX up to 10 MB
                </p>
              </button>
            ) : (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-blue-100">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatFileSize(
                        selectedFile.size
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      removeSelectedFile
                    }
                    disabled={
                      isUploading
                    }
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-white hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Remove selected document"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={
                      removeSelectedFile
                    }
                    disabled={
                      isUploading
                    }
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleUpload
                    }
                    disabled={
                      isUploading ||
                      !selectedFile
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload Document
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* EMPTY DOCUMENT STATE */}
        {/* ================================================================== */}

        {!documentPath &&
          !showUpload && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
              <FileText className="mx-auto h-8 w-8 text-gray-400" />

              <p className="mt-3 text-sm font-medium text-gray-700">
                No lease document
              </p>

              <p className="mt-1 text-xs text-gray-500">
                No document has been uploaded for this lease.
              </p>
            </div>
          )}
      </div>
    </section>
  );
}