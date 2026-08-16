"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Tesseract from "tesseract.js";
import {
  CameraIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  CloudArrowUpIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://ishinadwelly.com/api";

import ReCAPTCHA from "react-google-recaptcha";

// NextJS Environment variables
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "YOUR_SITE_KEY";

interface ScanResult {
  text: string;
  confidence: number;
  idType?: string;
  extractedData?: {
    name?: string;
    idNumber?: string;
    serialNumber?: string;
    dateOfBirth?: string;
    expiryDate?: string;
    sex?: string;
  };
}

export default function IDScanner() {
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [contactMethod, setContactMethod] = useState<"PHONE" | "SOCIAL_MEDIA" | "IN_APP">("PHONE");
  const [finderPhone, setFinderPhone] = useState("");
  const [socialMediaHandle, setSocialMediaHandle] = useState("");
  const [foundLocation, setFoundLocation] = useState("");
  const [collectionLocation, setCollectionLocation] = useState("");
  const [selectedIdType, setSelectedIdType] = useState<
    "NATIONAL_ID" | "SCHOOL_ID"
  >(
    "NATIONAL_ID",
  );
  const [manualIdNumber, setManualIdNumber] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [idHolderName, setIdHolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);



  // Helper to rotate image
  const rotateImage = async (imageSrc: string, degrees: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        
        if (degrees === 90 || degrees === 270 || degrees === -90 || degrees === -270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((degrees * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = imageSrc;
    });
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setResult(null);
        setError(null);
        setSuccess(null);
        setUploaded(false);
        setRotation(0);
        setIsManualEntry(false);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setResult(null);
        setError(null);
        setSuccess(null);
        setUploaded(false);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const extractIDData = (text: string): ScanResult["extractedData"] => {
    const data: ScanResult["extractedData"] = {};
    
    // Split into lines for structured extraction
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    
    // Fix common OCR mistakes in numbers
    const fixOCRNumbers = (str: string): string => {
      return str
        .replace(/[oO]/g, "0")
        .replace(/[lI|]/g, "1")
        .replace(/[zZ]/g, "2")
        .replace(/[sS]/g, "5")
        .replace(/[bB]/g, "8");
    };

    // === KENYAN ID: Serial Number (9 digits) ===
    // Look for serial number patterns including OCR misreads like "sea nomser"
    const serialPatterns = [
      /SERIAL\s*NUMBER\s*[:\.]?\s*(\d{8,9})/gi,
      /SERIAL\s*NO\s*[:\.]?\s*(\d{8,9})/gi,
      /se[ar]i?[an]?l?\s*n[o0u]m[bs]?e?r?\s*[:\.]?\s*(\d{8,9})/gi,
      /sea\s*n[o0]m[bs]e?r?\s*[:\.]?\s*(\d{8,9})/gi,
    ];
    
    let serialNumber: string | null = null;
    for (const pattern of serialPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length >= 8) {
        serialNumber = match[1];
        break;
      }
    }
    
    // If not found by pattern, look for 9-digit number in top lines
    if (!serialNumber) {
      for (const line of lines.slice(0, 5)) {
        const nums = line.match(/\d{9}/g);
        if (nums) {
          serialNumber = nums[0];
          break;
        }
      }
    }

    // === KENYAN ID: ID Number (7-8 digits) ===
    const idPatterns = [
      /ID\s*NUMBER\s*[:\.]?\s*(\d{7,8})/gi,
      /ID\s*NO\s*[:\.]?\s*(\d{7,8})/gi,
      /[o0][mn]e?[mn]s?\s*[:\.]?\s*(\d{7,8})/gi, // OCR misread "omens" for ID NUMBER
      /NUMBER\s*[:\.]?\s*(\d{7,8})/gi,
    ];
    
    for (const pattern of idPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length >= 7 && match[1].length <= 8) {
        data.idNumber = match[1];
        break;
      }
    }
    
    // If not found, look for 7-8 digit number that's NOT the serial number
    if (!data.idNumber) {
      for (const line of lines.slice(0, 8)) {
        const fixedLine = fixOCRNumbers(line);
        const allNums = fixedLine.match(/\d{7,9}/g);
        if (allNums) {
          for (const num of allNums) {
            if ((num.length === 7 || num.length === 8) && num !== serialNumber) {
              data.idNumber = num;
              break;
            }
          }
          if (data.idNumber) break;
        }
      }
    }

    // === KENYAN ID: Full Names ===
    // Look for "FULL NAMES" label
    const namesIdx = lines.findIndex(l => 
      l.toUpperCase().includes("FULL NAME") || l.toUpperCase() === "FULL NAMES"
    );
    
    if (namesIdx !== -1 && namesIdx + 1 < lines.length) {
      let nameLine = lines[namesIdx + 1]
        .replace(/^[~\-\*\s]+/, "") // Remove leading symbols like ~
        .replace(/[^A-Za-z'\s-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
      
      // Exclude common labels
      const excludedWords = ["JAMHURI", "KENYA", "REPUBLIC", "SERIAL", "NUMBER", "ID", "DATE", "BIRTH", "SEX", "MALE", "FEMALE"];
      const nameWords = nameLine.split(/\s+/).filter(w => 
        w.length > 1 && !excludedWords.includes(w)
      );
      
      if (nameWords.length >= 2) {
        data.name = nameWords.join(" ");
      }
    }
    
    // Fallback: look for capitalized name-like text
    if (!data.name) {
      const capitalizedNames = text.match(/\b[A-Z][A-Z']+(?:\s+[A-Z][A-Z']+){1,3}\b/g);
      if (capitalizedNames) {
        const excludedWords = ["JAMHURI", "KENYA", "REPUBLIC", "SERIAL", "NUMBER", "DATE", "BIRTH", "FULL", "NAMES", "SEX", "MALE", "FEMALE", "DISTRICT", "PLACE", "ISSUE"];
        for (const phrase of capitalizedNames) {
          const words = phrase.split(/\s+/).filter(w => 
            w.length > 1 && !excludedWords.includes(w.toUpperCase())
          );
          if (words.length >= 2 && words.length <= 4) {
            data.name = words.join(" ");
            break;
          }
        }
      }
    }

    // === KENYAN ID: Date of Birth (DD.MM.YYYY format) ===
    const datePatterns = [
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/g,           // DD.MM.YYYY
      /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/g,     // DD. MM. YYYY (with spaces)
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,   // DD/MM/YYYY or DD-MM-YYYY
    ];
    
    // Find DOB line first
    const dobIdx = lines.findIndex(l => 
      l.toUpperCase().includes("DATE OF BIRTH") || l.toUpperCase().includes("BIRTH")
    );
    
    const searchLines = dobIdx !== -1 
      ? lines.slice(dobIdx, Math.min(dobIdx + 3, lines.length))
      : lines;
    
    for (const line of searchLines) {
      for (const pattern of datePatterns) {
        const match = pattern.exec(line);
        if (match) {
          const day = match[1].padStart(2, "0");
          const month = match[2].padStart(2, "0");
          const year = match[3];
          const yearNum = parseInt(year);
          // Birth year should be reasonable
          if (yearNum >= 1920 && yearNum <= 2015) {
            data.dateOfBirth = `${day}/${month}/${year}`;
            break;
          }
        }
      }
      if (data.dateOfBirth) break;
    }

    // === Add serial number if found ===
    if (serialNumber) {
      data.serialNumber = serialNumber;
    }

    // === KENYAN ID: Sex ===
    const sexIdx = lines.findIndex(l => l.toUpperCase().includes("SEX"));
    if (sexIdx !== -1) {
      for (let i = sexIdx; i < Math.min(sexIdx + 2, lines.length); i++) {
        const line = lines[i].toUpperCase();
        if (line.includes("FEMALE")) {
          data.sex = "FEMALE";
          break;
        } else if (line.includes("MALE") && !line.includes("FEMALE")) {
          data.sex = "MALE";
          break;
        }
      }
    }
    // Fallback: search entire text
    if (!data.sex) {
      if (/\bFEMALE\b/i.test(text)) data.sex = "FEMALE";
      else if (/\bMALE\b/i.test(text)) data.sex = "MALE";
    }

    return data;
  };

  const detectIDType = (text: string): string => {
    const textLower = text.toLowerCase();
    const textUpper = text.toUpperCase();
    
    // Kenyan ID detection - check for common Kenyan ID markers
    if (textLower.includes("jamhuri") || textLower.includes("kenya") || 
        textUpper.includes("REPUBLIC OF KENYA") || textLower.includes("kenyan")) {
      return "Kenyan National ID";
    }
    if (textLower.includes("passport")) return "Passport";
    if (textLower.includes("driver") || textLower.includes("license")) return "Driver's License";
    if (textLower.includes("national") || textLower.includes("identity")) return "National ID";
    if (textLower.includes("voter")) return "Voter ID";
    if (textLower.includes("student")) return "Student ID";
    if (textLower.includes("employee") || textLower.includes("staff")) return "Employee ID";
    
    return "Unknown ID Type";
  };

  const scanImage = async () => {
    if (!image) return;

    setScanning(true);
    setProgress(0);
    setError(null);
    setSuccess(null);
    setResult(null);

    try {
      // Apply rotation if needed
      let imageToScan = image;
      if (rotation !== 0) {
        imageToScan = await rotateImage(image, rotation);
      }
      
      const result = await Tesseract.recognize(imageToScan, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const extractedData = extractIDData(result.data.text);
      const idType = detectIDType(result.data.text);

      // We no longer record scans for rate limiting on the frontend

      setResult({
        text: result.data.text,
        confidence: result.data.confidence,
        idType,
        extractedData,
      });
      if (extractedData?.name) {
        setIdHolderName(extractedData.name);
      }
    } catch (err) {
      setError("Failed to scan image. Please try again with a clearer image.");
      console.error("OCR Error:", err);
    } finally {
      setScanning(false);
    }
  };

  // Upload found ID to database
  const uploadFoundId = async () => {
    const resolvedName = idHolderName.trim() || result?.extractedData?.name;
    const resolvedIdNumber = manualIdNumber.trim() || result?.extractedData?.idNumber;
    
    if (!resolvedIdNumber) {
      setError("Cannot upload: ID number is required.");
      return;
    }

    if (!resolvedName) {
      setError("Please enter the name on the ID.");
      return;
    }

    if (selectedIdType === "SCHOOL_ID" && !schoolName.trim()) {
      setError("Please enter the school name for School ID.");
      return;
    }

    if (contactMethod === "PHONE" && !finderPhone.trim()) {
      setError("Please enter your phone number so the owner can contact you.");
      return;
    }

    if (contactMethod === "SOCIAL_MEDIA" && !socialMediaHandle.trim()) {
      setError("Please enter your social media handle so the owner can contact you.");
      return;
    }

    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Parse date of birth if available (format: DD/MM/YYYY -> YYYY-MM-DD)
      let dateOfBirth: string | null = null;
      if (result?.extractedData?.dateOfBirth) {
        const parts = result!.extractedData!.dateOfBirth!.split("/");
        if (parts.length === 3) {
          dateOfBirth = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      const response = await fetch(`${API_BASE}/found-ids`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Client-Type": "WEB_ADMIN"
        },
        body: JSON.stringify({
          idNumber: resolvedIdNumber,
          fullName: resolvedName,
          idType: selectedIdType,
          schoolName: selectedIdType === "SCHOOL_ID" ? schoolName.trim() : null,
          dateOfBirth: dateOfBirth,
          contactMethod: contactMethod,
          finderPhone: contactMethod === "PHONE" ? finderPhone.trim() : null,
          socialMediaHandle: contactMethod === "SOCIAL_MEDIA" ? socialMediaHandle.trim() : null,
          foundLocation: foundLocation.trim() || null,
          collectionLocation: collectionLocation.trim() || null,
          recaptchaToken: recaptchaToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message || "ID uploaded successfully! The owner can now find your contact information.");
        setUploaded(true);
      } else {
        const errorData = await response.json();
        if (errorData.code === "ALREADY_REGISTERED") {
          setError("This ID has already been registered by someone else.");
        } else if (errorData.code === "CAPTCHA_FAILED" || errorData.code === "CAPTCHA_REQUIRED") {
          setError("reCAPTCHA verification failed. Please check the reCAPTCHA box again.");
          setRecaptchaToken(null);
        } else {
          setError(errorData.error || "Failed to upload ID. Please try again.");
        }
      }
    } catch (err) {
      setError("Failed to connect to server. Please check your connection and try again.");
      console.error("Upload Error:", err);
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setSuccess(null);
    setProgress(0);
    setRotation(0);
    setUploaded(false);
    setIsManualEntry(false);
    setFinderPhone("");
    setFoundLocation("");
    setCollectionLocation("");
    setSchoolName("");
    setIdHolderName("");
    setSelectedIdType("NATIONAL_ID");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Notice Banner */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800">Scan Only - No Search Available</h3>
            <p className="text-amber-700 text-sm mt-1">
              This web scanner is designed for uploading and scanning images of lost IDs only.
              To search for lost IDs in our database, please download the FindMyID mobile app.
            </p>
            <a
              href="/download"
              className="inline-flex items-center gap-2 mt-3 text-amber-800 hover:text-amber-900 font-medium text-sm"
            >
              <DevicePhoneMobileIcon className="w-5 h-5" />
              Download the App to Search
            </a>
          </div>
        </div>
      </div>
      {/* Upload Area */}
      {!image && !isManualEntry && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <DocumentArrowUpIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your ID image here or click to upload
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports JPG, PNG, WEBP files up to 10MB
              </p>
            </div>
            <button
              type="button"
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <CameraIcon className="w-5 h-5" />
              Select Image
            </button>
            <div className="w-full max-w-xs border-t border-gray-200 my-2"></div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsManualEntry(true);
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              Enter Details Manually
            </button>
          </div>
        </div>
      )}

      {/* Image Preview and Scan Results */}
      {/* Image Preview and Scan Results */}
      {(image || isManualEntry) && (
        <div className="space-y-6">
          {/* Image Preview */}
          {image && !isManualEntry && (
            <div className="relative rounded-xl overflow-hidden bg-gray-100">
            <img
              src={image}
              alt="ID Preview"
              style={{ transform: `rotate(${rotation}deg)` }}
              className="w-full max-h-96 object-contain transition-transform duration-300"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setRotation((prev) => (prev - 90) % 360)}
                className="p-2 bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors"
                title="Rotate left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="p-2 bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors"
                title="Rotate right"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a1 1 0 000-2H4.065a1 1 0 00-1 1v4.167a1 1 0 002 0v-1.95l.31.31a7.5 7.5 0 0012.548-3.364 1 1 0 00-1.611-.318zM4.688 8.576a5.5 5.5 0 019.201-2.466l.312.311h-2.433a1 1 0 000 2h4.167a1 1 0 001-1V3.254a1 1 0 00-2 0v1.95l-.31-.31a7.5 7.5 0 00-12.548 3.364 1 1 0 001.611.318z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={clearImage}
                className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          )}

          {/* Scan Button */}
          {image && !isManualEntry && !result && (
            <div className="flex justify-center">
              <button
                onClick={scanImage}
                disabled={scanning}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scanning ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Scanning... {progress}%
                  </>
                ) : (
                  <>
                    <CameraIcon className="w-5 h-5" />
                    Scan ID
                  </>
                )}
              </button>
            </div>
          )}

          {/* Progress Bar */}
          {!isManualEntry && scanning && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Error Display */}
          {error && !uploaded && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-red-800">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Success Display */}
          {!isManualEntry && success && !result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-green-800">Success</h3>
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {(result || isManualEntry) && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {result ? (
                <div className="px-6 py-4 bg-green-50 border-b border-green-100 flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">Scan Complete</h3>
                    <p className="text-sm text-green-700">
                      Confidence: {result.confidence.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
                  <DocumentArrowUpIcon className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-800">Manual Entry</h3>
                    <p className="text-sm text-blue-700">
                      Please enter the details found on the ID card.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-6 space-y-6">
                {/* ID Type */}
                {result && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Detected ID Type</h4>
                    <p className="text-lg font-semibold text-gray-900">{result.idType}</p>
                  </div>
                )}

                {/* Extracted Data */}
                {result?.extractedData && Object.keys(result.extractedData).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Extracted Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.extractedData.name && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Full Name</p>
                          <p className="font-medium text-gray-900">{result.extractedData.name}</p>
                        </div>
                      )}
                      {result.extractedData.idNumber && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">ID Number</p>
                          <p className="font-medium text-gray-900">{result.extractedData.idNumber}</p>
                        </div>
                      )}
                      {result.extractedData.serialNumber && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Serial Number</p>
                          <p className="font-medium text-gray-900">{result.extractedData.serialNumber}</p>
                        </div>
                      )}
                      {result.extractedData.dateOfBirth && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Date of Birth</p>
                          <p className="font-medium text-gray-900">{result.extractedData.dateOfBirth}</p>
                        </div>
                      )}
                      {result.extractedData.sex && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Sex</p>
                          <p className="font-medium text-gray-900">{result.extractedData.sex}</p>
                        </div>
                      )}
                      {result.extractedData.expiryDate && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Expiry Date</p>
                          <p className="font-medium text-gray-900">{result.extractedData.expiryDate}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Download App CTA */}
                  {!uploaded && (result?.extractedData?.idNumber || isManualEntry) && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <ArrowUpTrayIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-800">Submit Found ID</h4>
                          <p className="text-green-700 text-sm mt-1">
                            Help the owner find their ID by registering it in our database.
                            They can then search and contact you.
                          </p>
                        </div>
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-red-800">Submission Error</h4>
                            <p className="text-red-700 text-sm mt-0.5">{error}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ID Type *
                          </label>
                          <select
                            value={selectedIdType}
                            onChange={(e) => setSelectedIdType(e.target.value as "NATIONAL_ID" | "SCHOOL_ID")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="NATIONAL_ID">National ID</option>
                            <option value="SCHOOL_ID">School ID</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ID Number *
                          </label>
                          <input
                            type="text"
                            value={manualIdNumber || result?.extractedData?.idNumber || ""}
                            onChange={(e) => setManualIdNumber(e.target.value)}
                            placeholder="e.g., 12345678"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            readOnly={!!result?.extractedData?.idNumber && !isManualEntry}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name on ID {selectedIdType === "SCHOOL_ID" ? "*" : ""}
                          </label>
                          <input
                            type="text"
                            value={idHolderName}
                            onChange={(e) => setIdHolderName(e.target.value)}
                            placeholder="e.g., JOHN DOE"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Used to match search results.
                          </p>
                        </div>

                        {selectedIdType === "SCHOOL_ID" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              School Name *
                            </label>
                            <input
                              type="text"
                              value={schoolName}
                              onChange={(e) => setSchoolName(e.target.value)}
                              placeholder="e.g., Nairobi School"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Preferred Contact Method *
                          </label>
                          <select
                            value={contactMethod}
                            onChange={(e) => setContactMethod(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-3"
                          >
                            <option value="PHONE">Phone Number</option>
                            <option value="SOCIAL_MEDIA">Social Media Handle (Twitter, Instagram, etc.)</option>
                            <option value="IN_APP">Temporary In-App Chat (Anonymous)</option>
                          </select>

                          {contactMethod === "PHONE" && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Your Phone Number *
                              </label>
                              <input
                                type="tel"
                                value={finderPhone}
                                onChange={(e) => setFinderPhone(e.target.value)}
                                placeholder="e.g., 0712345678"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                The ID owner will use this phone number to contact you.
                              </p>
                            </div>
                          )}

                          {contactMethod === "SOCIAL_MEDIA" && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Social Media Handle *
                              </label>
                              <input
                                type="text"
                                value={socialMediaHandle}
                                onChange={(e) => setSocialMediaHandle(e.target.value)}
                                placeholder="e.g., @johndoe on Twitter or instagram.com/johndoe"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                The ID owner will reach out to you via your social handle.
                              </p>
                            </div>
                          )}

                          {contactMethod === "IN_APP" && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                              <p className="font-medium">Anonymous In-App Chat Selected</p>
                              <p className="text-xs mt-1">
                                The ID owner will contact you through our secure in-app messaging without seeing your phone number or identity.
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Where did you find it? (Optional)
                          </label>
                          <input
                            type="text"
                            value={foundLocation}
                            onChange={(e) => setFoundLocation(e.target.value)}
                            placeholder="e.g., Nairobi CBD, near GPO"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Where can they collect it? (Optional)
                          </label>
                          <input
                            type="text"
                            value={collectionLocation}
                            onChange={(e) => setCollectionLocation(e.target.value)}
                            placeholder="e.g., My shop on Moi Avenue, or Police Station"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        
                        <div className="flex justify-center my-4">
                          <ReCAPTCHA
                            sitekey={RECAPTCHA_SITE_KEY}
                            onChange={(token) => {
                              setRecaptchaToken(token);
                              if (token) setError(null);
                            }}
                          />
                        </div>
                        
                        <button
                          onClick={uploadFoundId}
                          disabled={uploading || (contactMethod === "PHONE" && !finderPhone.trim()) || (contactMethod === "SOCIAL_MEDIA" && !socialMediaHandle.trim())}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploading ? (
                            <>
                              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <ArrowUpTrayIcon className="w-5 h-5" />
                              Upload Found ID
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Success */}
                {uploaded && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-800">ID Uploaded Successfully!</h4>
                        <p className="text-green-700 text-sm mt-1">
                          Thank you for helping! The ID owner can now search our database and find your contact information.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Download App CTA */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800">Lost your ID?</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        Download our mobile app to search the database of found IDs
                        and get notified when someone finds yours.
                      </p>
                      <div className="flex flex-wrap gap-3 mt-3">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            alert("Apple iOS version is coming soon!");
                          }}
                          className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                          </svg>
                          App Store (Coming Soon)
                        </a>
                        <a
                          href="https://play.google.com/store/apps/details?id=com.ishinadwelly.app"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                          </svg>
                          Google Play
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={clearImage}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {isManualEntry ? "Cancel" : "Scan Another"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
