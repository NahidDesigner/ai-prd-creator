import { useState, useCallback } from "react";
import { Upload, File, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileContent: (content: string | null) => void;
}

export function FileUpload({ onFileContent }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setUploadedFile(file);
    
    try {
      const text = await file.text();
      onFileContent(text);
    } catch (error) {
      console.error("Error reading file:", error);
      onFileContent(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    onFileContent(null);
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <FileText className="w-4 h-4 text-primary" />
        Upload Project Files
        <span className="text-muted-foreground font-normal">(optional)</span>
      </label>
      
      {!uploadedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 text-center cursor-pointer group",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50 hover:bg-card/50"
          )}
        >
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".json,.txt,.md,.ts,.tsx,.js,.jsx,.py,.yaml,.yml"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className={cn(
            "w-10 h-10 mx-auto mb-3 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground group-hover:text-primary"
          )} />
          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JSON, Markdown, TypeScript, JavaScript, Python, YAML
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
          <div className="p-2 rounded-lg bg-primary/10">
            <File className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{uploadedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {isProcessing ? "Processing..." : `${(uploadedFile.size / 1024).toFixed(1)} KB`}
            </p>
          </div>
          <button
            onClick={removeFile}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}
