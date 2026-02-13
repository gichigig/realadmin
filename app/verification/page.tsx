"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { verificationApi, filesApi } from "@/lib/api";
import { scanIDCard, IDScanResult } from "@/lib/id-scanner";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  IdentificationIcon,
  DevicePhoneMobileIcon,
  FaceSmileIcon,
  ArrowPathIcon,
  CameraIcon,
  PhotoIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

type FaceStep = "idle" | "ready" | "left" | "right" | "done";

// localStorage keys for persistence
const STORAGE_KEY_FACE_IMAGES = "verification_face_images";

// Progress Circle Component
function ProgressCircle({ progress, completed, label, active }: { 
  progress: number; 
  completed: boolean; 
  label: string;
  active: boolean;
}) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="70" height="70" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="35"
            cy="35"
            r={radius}
            stroke={active ? "#e5e7eb" : "#f3f4f6"}
            strokeWidth="6"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="35"
            cy="35"
            r={radius}
            stroke={completed ? "#22c55e" : active ? "#3b82f6" : "#d1d5db"}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={completed ? 0 : strokeDashoffset}
            className="transition-all duration-150"
          />
        </svg>
        {/* Center icon/checkmark */}
        <div className="absolute inset-0 flex items-center justify-center">
          {completed ? (
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          ) : (
            <span className={`text-lg font-bold ${active ? "text-blue-600" : "text-gray-400"}`}>
              {label === "Front" ? "👤" : label === "Left" ? "←" : "→"}
            </span>
          )}
        </div>
      </div>
      <span className={`text-sm font-medium ${completed ? "text-green-600" : active ? "text-blue-600" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}

export default function VerificationPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form state
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<"INDIVIDUAL" | "AGENT" | "COMPANY">("INDIVIDUAL");
  
  // ID Image upload state
  const [idImage, setIdImage] = useState<File | null>(null);
  const [idImagePreview, setIdImagePreview] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ID Scan state
  const [scanningId, setScanningId] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [idScanResult, setIdScanResult] = useState<IDScanResult | null>(null);
  const [idVerified, setIdVerified] = useState(false);
  const [nameVerified, setNameVerified] = useState(false);
  
  // Face verification state
  const [faceStep, setFaceStep] = useState<FaceStep>("idle");
  const [faceImages, setFaceImages] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const faceStepRef = useRef<FaceStep>("idle");
  
  // Auto-detection state
  const [faceDetected, setFaceDetected] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [stepProgress, setStepProgress] = useState<[number, number, number]>([0, 0, 0]);
  const [statusMessage, setStatusMessage] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const faceDetectorRef = useRef<any>(null);
  const progressAccumulatorRef = useRef(0);

  // Keep ref in sync with state
  useEffect(() => {
    faceStepRef.current = faceStep;
  }, [faceStep]);

  // Load saved face images from localStorage on mount
  useEffect(() => {
    try {
      const savedImages = localStorage.getItem(STORAGE_KEY_FACE_IMAGES);
      if (savedImages) {
        const images = JSON.parse(savedImages);
        if (Array.isArray(images) && images.length > 0) {
          setFaceImages(images);
          if (images.length >= 3) {
            setFaceStep("done");
            setStepProgress([100, 100, 100]);
          }
        }
      }
    } catch (e) {
      console.error("Error loading saved face images:", e);
    }
  }, []);

  // Save face images to localStorage whenever they change
  useEffect(() => {
    if (faceImages.length > 0) {
      localStorage.setItem(STORAGE_KEY_FACE_IMAGES, JSON.stringify(faceImages));
    }
  }, [faceImages]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setPhone(user.verifiedPhone || user.phone || "");
      setUserType((user.userType as "INDIVIDUAL" | "AGENT" | "COMPANY") || "INDIVIDUAL");
    }
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Helper to rotate image and return as blob
  const rotateImage = async (imageSrc: string, degrees: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        
        // Swap dimensions for 90/270 degree rotations
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
        
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        }, "image/png");
      };
      img.onerror = reject;
      img.src = imageSrc;
    });
  };

  // Rescan with current rotation
  const rescanWithRotation = async () => {
    if (!idImagePreview) return;
    
    setScanningId(true);
    setScanProgress(0);
    setIdScanResult(null);
    setIdVerified(false);
    setNameVerified(false);
    setError("");
    
    try {
      // Apply rotation if needed
      let imageToScan: Blob | string = idImagePreview;
      if (imageRotation !== 0) {
        imageToScan = await rotateImage(idImagePreview, imageRotation);
      }
      
      const result = await scanIDCard(
        imageToScan instanceof Blob ? new File([imageToScan], "rotated-id.png", { type: "image/png" }) : imageToScan,
        user?.firstName,
        user?.lastName,
        (progress) => setScanProgress(progress)
      );
      
      setIdScanResult(result);
      
      if (result.success) {
        // Verify that names on ID match account names
        const accountFirstName = (user?.firstName || "").toUpperCase().trim();
        const accountLastName = (user?.lastName || "").toUpperCase().trim();
        const idFirstName = (result.firstName || "").toUpperCase().trim();
        const idLastName = (result.lastName || "").toUpperCase().trim();
        const idFullNames = (result.fullNames || "").toUpperCase();
        
        const firstNameMatch = idFirstName.includes(accountFirstName) || 
                               accountFirstName.includes(idFirstName) ||
                               idFullNames.includes(accountFirstName);
        const lastNameMatch = idLastName.includes(accountLastName) || 
                              accountLastName.includes(idLastName) ||
                              idFullNames.includes(accountLastName);
        
        const namesMatch = firstNameMatch && lastNameMatch;
        setNameVerified(namesMatch);
        
        if (!namesMatch) {
          setIdVerified(false);
          const idName = result.fullNames || `${result.firstName || ""} ${result.lastName || ""}`.trim();
          setError(`Name mismatch! Your account name (${user?.firstName} ${user?.lastName}) does not match the name on the ID (${idName}). Please update your account name in Settings or use an ID that matches your account.`);
        } else {
          setIdVerified(true);
          const extractedName = result.fullNames || `${result.firstName || ""} ${result.lastName || ""}`.trim();
          let successMsg = `Kenyan ID verified! ID: ${result.idNumber}`;
          if (extractedName) successMsg += `, Name: ${extractedName} ✓`;
          if (result.dateOfBirth) successMsg += `, DOB: ${result.dateOfBirth}`;
          if (result.warnings && result.warnings.length > 0) {
            successMsg += ` (Note: ${result.warnings.join("; ")})`;
          }
          setSuccess(successMsg);
        }
      } else {
        setError(result.errors.join(" "));
        setIdVerified(false);
        setNameVerified(false);
      }
    } catch (err) {
      setError("Failed to scan ID card. Please try again.");
      setIdVerified(false);
      setNameVerified(false);
    } finally {
      setScanningId(false);
      setScanProgress(0);
    }
  };

  // ID Image handling
  const handleIdImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size must be less than 10MB");
        return;
      }
      
      setIdImage(file);
      setIdScanResult(null);
      setIdVerified(false);
      setImageRotation(0);
      setError("");
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setIdImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Scan the ID
      setScanningId(true);
      setScanProgress(0);
      
      try {
        const result = await scanIDCard(
          file,
          user?.firstName,
          user?.lastName,
          (progress) => setScanProgress(progress)
        );
        
        setIdScanResult(result);
        
        if (result.success) {
          // Verify that names on ID match account names
          const accountFirstName = (user?.firstName || "").toUpperCase().trim();
          const accountLastName = (user?.lastName || "").toUpperCase().trim();
          const idFirstName = (result.firstName || "").toUpperCase().trim();
          const idLastName = (result.lastName || "").toUpperCase().trim();
          const idFullNames = (result.fullNames || "").toUpperCase();
          
          // Check if account name appears in ID names
          const firstNameMatch = idFirstName.includes(accountFirstName) || 
                                 accountFirstName.includes(idFirstName) ||
                                 idFullNames.includes(accountFirstName);
          const lastNameMatch = idLastName.includes(accountLastName) || 
                                accountLastName.includes(idLastName) ||
                                idFullNames.includes(accountLastName);
          
          const namesMatch = firstNameMatch && lastNameMatch;
          setNameVerified(namesMatch);
          
          if (!namesMatch) {
            setIdVerified(false);
            const idName = result.fullNames || `${result.firstName || ""} ${result.lastName || ""}`.trim();
            setError(`Name mismatch! Your account name (${user?.firstName} ${user?.lastName}) does not match the name on the ID (${idName}). Please update your account name in Settings or use an ID that matches your account.`);
          } else {
            setIdVerified(true);
            const extractedName = result.fullNames || `${result.firstName || ""} ${result.lastName || ""}`.trim();
            let successMsg = `Kenyan ID verified! ID: ${result.idNumber}`;
            if (extractedName) successMsg += `, Name: ${extractedName} ✓`;
            if (result.dateOfBirth) successMsg += `, DOB: ${result.dateOfBirth}`;
            
            if (result.warnings && result.warnings.length > 0) {
              successMsg += ` (Note: ${result.warnings.join("; ")})`;
            }
            setSuccess(successMsg);
          }
        } else {
          setError(result.errors.join(" "));
          setIdVerified(false);
          setNameVerified(false);
        }
      } catch (err) {
        setError("Failed to scan ID card. Please try again with a clearer image.");
        setIdVerified(false);
      } finally {
        setScanningId(false);
        setScanProgress(0);
      }
    }
  };

  const removeIdImage = () => {
    setIdImage(null);
    setIdImagePreview(null);
    setIdScanResult(null);
    setImageRotation(0);
    setIdVerified(false);
    setNameVerified(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Initialize face detector
  const initFaceDetector = async (): Promise<boolean> => {
    if ('FaceDetector' in window) {
      try {
        // @ts-ignore - FaceDetector is experimental API
        faceDetectorRef.current = new window.FaceDetector({ 
          fastMode: true, 
          maxDetectedFaces: 1 
        });
        console.log("Native FaceDetector initialized");
        return true;
      } catch (e) {
        console.log("FaceDetector not supported, using fallback");
      }
    }
    return false;
  };

  // Detect face position in video frame
  const detectFace = useCallback(async (): Promise<{ detected: boolean; x: number; centered: boolean } | null> => {
    if (!videoRef.current) return null;
    
    const video = videoRef.current;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    if (videoWidth === 0 || videoHeight === 0) return null;
    
    try {
      if (faceDetectorRef.current) {
        // Use native FaceDetector API (Chrome 70+)
        const faces = await faceDetectorRef.current.detect(video);
        
        if (faces.length > 0) {
          const face = faces[0].boundingBox;
          const faceCenterX = face.x + face.width / 2;
          
          // Normalize X position to -1 to 1 range
          const normalizedX = ((faceCenterX / videoWidth) - 0.5) * 2;
          
          // Check if face is in center zone
          const isCentered = Math.abs(normalizedX) < 0.25;
          
          setFaceDetected(true);
          
          return { detected: true, x: normalizedX, centered: isCentered };
        }
      }
      
      // Fallback: Basic motion/brightness detection (works for all skin tones)
      if (!canvasRef.current) return null;
      
      const canvas = canvasRef.current;
      canvas.width = 120;
      canvas.height = 90;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      
      ctx.drawImage(video, 0, 0, 120, 90);
      
      // Analyze left, center, right regions for presence detection
      const analyzeRegion = (startX: number, width: number): number => {
        const imageData = ctx.getImageData(startX, 20, width, 50);
        const data = imageData.data;
        let variance = 0;
        let brightness = 0;
        const pixelCount = width * 50;
        
        // Calculate average brightness and variance (indicates presence of something)
        for (let i = 0; i < data.length; i += 4) {
          const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
          brightness += gray;
        }
        brightness /= pixelCount;
        
        for (let i = 0; i < data.length; i += 4) {
          const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
          variance += Math.pow(gray - brightness, 2);
        }
        variance = Math.sqrt(variance / pixelCount);
        
        // Higher variance indicates more detail (like a face)
        // Return a score based on variance and brightness being in face-like range
        const brightnessScore = brightness > 50 && brightness < 220 ? 1 : 0.5;
        return (variance / 80) * brightnessScore; // Normalize variance
      };
      
      const leftScore = analyzeRegion(0, 35);
      const centerScore = analyzeRegion(42, 36);
      const rightScore = analyzeRegion(85, 35);
      
      const totalScore = leftScore + centerScore + rightScore;
      const maxScore = Math.max(leftScore, centerScore, rightScore);
      
      // Detect face if there's enough variance (detail) in the center area
      if (totalScore > 0.3 && maxScore > 0.15) {
        // Calculate weighted position based on where most detail is
        const normalizedX = (rightScore - leftScore) / Math.max(totalScore, 0.01);
        const isCentered = centerScore >= leftScore * 0.8 && centerScore >= rightScore * 0.8;
        
        setFaceDetected(true);
        return { detected: true, x: normalizedX, centered: isCentered };
      }
    } catch (e) {
      console.error("Face detection error:", e);
    }
    
    setFaceDetected(false);
    return { detected: false, x: 0, centered: false };
  }, []);

  // Check if face position matches current step requirement
  const isFacePositionCorrect = useCallback((x: number): boolean => {
    const currentStep = faceStepRef.current;
    
    switch (currentStep) {
      case "ready":
        // Face should be centered
        return Math.abs(x) < 0.25;
      case "left":
        // Face should be turned left (appears on right side due to mirror)
        return x > 0.15;
      case "right":
        // Face should be turned right (appears on left side due to mirror)
        return x < -0.15;
      default:
        return false;
    }
  }, []);

  // Capture a frame from the video
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    
    // Mirror the image for natural selfie appearance
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  // Stop camera and cleanup
  const stopCamera = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
  }, []);

  // Auto-capture logic - using refs to avoid stale closures
  const runDetection = useCallback(async () => {
    if (isCapturing || faceStepRef.current === "done" || faceStepRef.current === "idle") {
      return;
    }
    
    const result = await detectFace();
    const currentStep = faceStepRef.current;
    
    if (!result?.detected) {
      progressAccumulatorRef.current = 0;
      setCaptureProgress(0);
      setStatusMessage("Position your face in the oval");
      return;
    }
    
    const positionCorrect = isFacePositionCorrect(result.x);
    
    if (!positionCorrect) {
      progressAccumulatorRef.current = Math.max(0, progressAccumulatorRef.current - 10);
      setCaptureProgress(progressAccumulatorRef.current);
      
      if (currentStep === "ready") {
        setStatusMessage("Center your face in the oval");
      } else if (currentStep === "left") {
        setStatusMessage("Turn your head to the LEFT ←");
      } else if (currentStep === "right") {
        setStatusMessage("Turn your head to the RIGHT →");
      }
      return;
    }
    
    // Position is correct - accumulate progress
    progressAccumulatorRef.current = Math.min(progressAccumulatorRef.current + 12, 100);
    setCaptureProgress(progressAccumulatorRef.current);
    
    const holdMessage = currentStep === "ready" ? "Hold still..." : 
                        currentStep === "left" ? "Hold left position..." : 
                        "Hold right position...";
    setStatusMessage(holdMessage);
    
    // Update the current step's progress circle
    const stepIndex = currentStep === "ready" ? 0 : currentStep === "left" ? 1 : 2;
    setStepProgress(prev => {
      const newProgress = [...prev] as [number, number, number];
      newProgress[stepIndex] = progressAccumulatorRef.current;
      return newProgress;
    });
    
    // Check if progress is complete
    if (progressAccumulatorRef.current >= 100 && !isCapturing) {
      setIsCapturing(true);
      
      // Brief flash effect then capture
      setTimeout(() => {
        const frame = captureFrame();
        
        if (frame) {
          // Mark step as complete
          setStepProgress(prev => {
            const newProgress = [...prev] as [number, number, number];
            newProgress[stepIndex] = 100;
            return newProgress;
          });
          
          // Add image to collection
          setFaceImages(prevImages => {
            const newImages = [...prevImages, frame];
            return newImages;
          });
          
          // Move to next step
          if (currentStep === "ready") {
            setFaceStep("left");
            setStatusMessage("✓ Great! Now turn LEFT");
          } else if (currentStep === "left") {
            setFaceStep("right");
            setStatusMessage("✓ Perfect! Now turn RIGHT");
          } else if (currentStep === "right") {
            setFaceStep("done");
            stopCamera();
            setStatusMessage("✓ Face scan complete!");
          }
        }
        
        progressAccumulatorRef.current = 0;
        setCaptureProgress(0);
        setIsCapturing(false);
      }, 300);
    }
  }, [isCapturing, detectFace, isFacePositionCorrect, captureFrame, stopCamera]);

  // Start camera and face detection
  const startCamera = useCallback(async () => {
    try {
      setCameraActive(true);
      setFaceStep("ready");
      setStatusMessage("Starting camera...");
      setStepProgress([0, 0, 0]);
      setFaceDetected(false);
      progressAccumulatorRef.current = 0;
      
      // Wait for video element to mount
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Initialize face detector
      await initFaceDetector();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 640, height: 480 } 
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      // Wait a moment for video to start playing
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setStatusMessage("Position your face in the oval");
      
      // Start face detection loop (~8 FPS)
      detectionIntervalRef.current = setInterval(() => {
        runDetection();
      }, 125);
      
    } catch (err) {
      console.error("Camera error:", err);
      setCameraActive(false);
      setFaceStep("idle");
      setError("Could not access camera. Please grant camera permissions.");
    }
  }, [runDetection]);

  // Reset face verification
  const resetFaceVerification = useCallback(() => {
    stopCamera();
    setFaceStep("idle");
    setFaceImages([]);
    setFaceDetected(false);
    setCaptureProgress(0);
    setStepProgress([0, 0, 0]);
    setStatusMessage("");
    progressAccumulatorRef.current = 0;
    localStorage.removeItem(STORAGE_KEY_FACE_IMAGES);
  }, [stopCamera]);

  const getFaceInstruction = () => {
    switch (faceStep) {
      case "ready":
        return { title: "Look Straight", desc: "Position your face in the oval and look directly at the camera" };
      case "left":
        return { title: "Turn Left", desc: "Slowly turn your head to the LEFT while keeping your face visible" };
      case "right":
        return { title: "Turn Right", desc: "Slowly turn your head to the RIGHT while keeping your face visible" };
      default:
        return { title: "", desc: "" };
    }
  };

  // Handle form submission - uploads images to server
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!idImage) {
      setError("Please upload your ID card image");
      return;
    }
    if (!idVerified || !idScanResult?.success) {
      setError("ID verification failed. Please upload a clear photo of your ID card where all details are visible.");
      return;
    }
    if (!nameVerified) {
      const idName = idScanResult?.fullNames || `${idScanResult?.firstName || ""} ${idScanResult?.lastName || ""}`.trim();
      setError(`Name mismatch! Your account name (${user?.firstName} ${user?.lastName}) does not match the name on the ID (${idName}). Please update your account name in Settings first.`);
      return;
    }
    if (!phone.trim()) {
      setError("Phone number is required");
      return;
    }
    if (faceImages.length < 3) {
      setError("Face verification is required. Please complete the face scan.");
      return;
    }

    setLoading(true);
    try {
      // Upload ID image first
      setUploadingId(true);
      const idUploadResult = await filesApi.upload(idImage);
      setUploadingId(false);
      
      // Submit verification with uploaded ID URL, face images, and scanned data
      await verificationApi.submitVerification({
        nationalIdImageUrl: filesApi.getUrl(idUploadResult.filename),
        phone,
        faceImageUrl: faceImages[0],
        faceImageLeftUrl: faceImages[1],
        faceImageRightUrl: faceImages[2],
        userType,
        // Include scanned Kenyan ID data
        scannedIdNumber: idScanResult.idNumber || undefined,
        scannedSerialNumber: idScanResult.serialNumber || undefined,
        scannedDateOfBirth: idScanResult.dateOfBirth || undefined,
        scannedFullNames: idScanResult.fullNames || undefined,
        scannedFirstName: idScanResult.firstName || undefined,
        scannedMiddleName: idScanResult.middleName || undefined,
        scannedLastName: idScanResult.lastName || undefined,
        scannedSex: idScanResult.sex || undefined,
        scannedDistrictOfBirth: idScanResult.districtOfBirth || undefined,
        scannedPlaceOfIssue: idScanResult.placeOfIssue || undefined,
        scannedDateOfIssue: idScanResult.dateOfIssue || undefined,
      });
      
      // Clear localStorage after successful upload
      localStorage.removeItem(STORAGE_KEY_FACE_IMAGES);
      
      setSuccess("Verification submitted successfully! Please wait for super admin approval.");
      refreshUser();
    } catch (err: any) {
      setError(err.message || "Failed to submit verification");
    } finally {
      setLoading(false);
      setUploadingId(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (user?.verificationStatus) {
      case "VERIFIED":
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
            <CheckCircleIcon className="h-5 w-5" />
            <span>Verified</span>
          </div>
        );
      case "PENDING":
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
            <ClockIcon className="h-5 w-5" />
            <span>Pending Review</span>
          </div>
        );
      case "REJECTED":
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg">
            <XCircleIcon className="h-5 w-5" />
            <span>Rejected - Please resubmit</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
            <IdentificationIcon className="h-5 w-5" />
            <span>Not Verified</span>
          </div>
        );
    }
  };

  const isVerified = user?.verificationStatus === "VERIFIED";
  const isPending = user?.verificationStatus === "PENDING";
  const instruction = getFaceInstruction();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Verification</h1>
        <p className="text-gray-600">
          Verify your identity to get a badge on your listings
        </p>
      </div>

      {/* Status Banner */}
      <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <div>
          <p className="text-sm text-gray-500">Current Status</p>
          {getStatusBadge()}
        </div>
        {user?.userType && (
          <div className="text-right">
            <p className="text-sm text-gray-500">Account Type</p>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              user.userType === "AGENT" ? "bg-amber-100 text-amber-700" : 
              user.userType === "COMPANY" ? "bg-purple-100 text-purple-700" : 
              "bg-blue-100 text-blue-700"
            }`}>
              {user.userType}
            </span>
          </div>
        )}
      </div>

      {isVerified && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-green-700">You are verified!</h2>
          <p className="text-green-600 mt-2">
            Your listings will display with a {user?.userType === "AGENT" ? "golden" : "blue"} verification badge.
          </p>
        </div>
      )}

      {isPending && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <ClockIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-700">Verification Pending</h2>
          <p className="text-yellow-600 mt-2">
            Your verification is being reviewed by our super admin team.
          </p>
        </div>
      )}

      {!isVerified && !isPending && (
        <>
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Type */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <IdentificationIcon className="h-5 w-5 text-blue-500" />
                Account Type
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {["INDIVIDUAL", "AGENT", "COMPANY"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setUserType(type as typeof userType)}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      userType === type
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium text-gray-900">{type}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {type === "INDIVIDUAL" ? "Blue badge" : type === "AGENT" ? "Gold badge" : "Purple badge"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* ID Card Image Upload */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <PhotoIcon className="h-5 w-5 text-blue-500" />
                ID Card Photo
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload a clear photo of your government-issued ID card (National ID, Passport, Driver&apos;s License).
                <br />
                <span className="text-amber-600 font-medium">Your name, ID number, and date of birth must be clearly visible.</span>
              </p>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleIdImageSelect}
                className="hidden"
                disabled={scanningId}
              />
              
              {!idImagePreview ? (
                <div
                  onClick={() => !scanningId && fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Click to upload ID card photo</p>
                  <p className="text-sm text-gray-400 mt-1">JPG, PNG up to 10MB</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={idImagePreview}
                      alt="ID Card Preview"
                      style={{ transform: `rotate(${imageRotation}deg)` }}
                      className={`w-full max-h-64 object-contain rounded-lg border-2 transition-transform duration-300 ${
                        idVerified ? "border-green-500" : 
                        idScanResult && !idScanResult.success ? "border-red-500" : 
                        "border-gray-200"
                      }`}
                    />
                    {!scanningId && (
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setImageRotation((prev) => (prev - 90) % 360)}
                          className="bg-gray-700 text-white p-2 rounded-full hover:bg-gray-800"
                          title="Rotate left"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                          className="bg-gray-700 text-white p-2 rounded-full hover:bg-gray-800"
                          title="Rotate right"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a1 1 0 000-2H4.065a1 1 0 00-1 1v4.167a1 1 0 002 0v-1.95l.31.31a7.5 7.5 0 0012.548-3.364 1 1 0 00-1.611-.318zM4.688 8.576a5.5 5.5 0 019.201-2.466l.312.311h-2.433a1 1 0 000 2h4.167a1 1 0 001-1V3.254a1 1 0 00-2 0v1.95l-.31-.31a7.5 7.5 0 00-12.548 3.364 1 1 0 001.611.318z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={removeIdImage}
                          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                          title="Remove image"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                    
                    {/* Scanning overlay */}
                    {scanningId && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex flex-col items-center justify-center">
                        <MagnifyingGlassIcon className="h-12 w-12 text-white animate-pulse mb-3" />
                        <p className="text-white font-medium">Scanning ID card...</p>
                        <div className="w-48 h-2 bg-gray-700 rounded-full mt-3 overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${scanProgress}%` }}
                          />
                        </div>
                        <p className="text-white/80 text-sm mt-2">{scanProgress}%</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Rotation hint and rescan button */}
                  {!scanningId && idScanResult && !idScanResult.success && (
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-700">
                        <span className="font-medium">Tip:</span> If the ID is sideways, use the rotate buttons above then click Rescan.
                      </p>
                      <button
                        type="button"
                        onClick={rescanWithRotation}
                        className="ml-3 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium flex items-center gap-2"
                      >
                        <MagnifyingGlassIcon className="h-4 w-4" />
                        Rescan
                      </button>
                    </div>
                  )}
                  
                  {/* Rescan button for when scan succeeded but user rotated */}
                  {!scanningId && imageRotation !== 0 && idScanResult?.success && (
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={rescanWithRotation}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium flex items-center gap-2"
                      >
                        <MagnifyingGlassIcon className="h-4 w-4" />
                        Rescan with new rotation
                      </button>
                    </div>
                  )}
                  
                  {/* Scan Results */}
                  {idScanResult && !scanningId && (
                    <div className={`p-4 rounded-lg ${
                      idScanResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                    }`}>
                      {idScanResult.success ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-green-700 font-medium">
                            <CheckCircleIcon className="h-5 w-5" />
                            <span>Kenyan ID Verified Successfully</span>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-green-100">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Extracted Details:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              {idScanResult.fullNames && (
                                <div className="col-span-full">
                                  <span className="text-gray-500">Full Names:</span>
                                  <span className="ml-2 font-medium text-gray-900">{idScanResult.fullNames}</span>
                                </div>
                              )}
                              {idScanResult.idNumber && (
                                <div>
                                  <span className="text-gray-500">ID Number:</span>
                                  <span className="ml-2 font-medium text-gray-900">{idScanResult.idNumber}</span>
                                </div>
                              )}
                              {idScanResult.serialNumber && (
                                <div>
                                  <span className="text-gray-500">Serial Number:</span>
                                  <span className="ml-2 font-medium text-gray-900">{idScanResult.serialNumber}</span>
                                </div>
                              )}
                              {idScanResult.dateOfBirth && (
                                <div>
                                  <span className="text-gray-500">Date of Birth:</span>
                                  <span className="ml-2 font-medium text-gray-900">{idScanResult.dateOfBirth}</span>
                                </div>
                              )}
                              {idScanResult.sex && (
                                <div>
                                  <span className="text-gray-500">Sex:</span>
                                  <span className="ml-2 font-medium text-gray-900">{idScanResult.sex}</span>
                                </div>
                              )}
                              {idScanResult.districtOfBirth && (
                                <div>
                                  <span className="text-gray-500">District of Birth:</span>
                                  <span className="ml-2 font-medium text-gray-900">{idScanResult.districtOfBirth}</span>
                                </div>
                              )}
                              {idScanResult.placeOfIssue && (
                                <div>
                                  <span className="text-gray-500">Place of Issue:</span>
                                  <span className="ml-2 font-medium text-gray-900">{idScanResult.placeOfIssue}</span>
                                </div>
                              )}
                              {idScanResult.dateOfIssue && (
                                <div>
                                  <span className="text-gray-500">Date of Issue:</span>
                                  <span className="ml-2 font-medium text-gray-900">{idScanResult.dateOfIssue}</span>
                                </div>
                              )}
                            </div>
                            {idScanResult.confidence && (
                              <div className="mt-3 pt-3 border-t border-green-100">
                                <span className="text-xs text-gray-400">
                                  Scan confidence: {Math.round(idScanResult.confidence)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-red-700 font-medium">
                            <XCircleIcon className="h-5 w-5" />
                            <span>ID Verification Failed</span>
                          </div>
                          <ul className="text-sm text-red-600 list-disc list-inside space-y-1">
                            {idScanResult.errors.map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                          <p className="text-sm text-red-500 mt-2">
                            Please upload a clearer photo where your name, ID number, and date of birth are visible.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Phone Verification */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <DevicePhoneMobileIcon className="h-5 w-5 text-blue-500" />
                Phone Number
              </h3>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Face Verification */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <FaceSmileIcon className="h-5 w-5 text-blue-500" />
                Face Verification
              </h3>
              
              <canvas ref={canvasRef} className="hidden" />
              
              {faceStep === "idle" && (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Complete a quick face scan to verify your identity
                  </p>
                  
                  {/* Progress circles preview */}
                  <div className="flex justify-center gap-6 mb-6">
                    <ProgressCircle progress={0} completed={false} label="Front" active={false} />
                    <ProgressCircle progress={0} completed={false} label="Left" active={false} />
                    <ProgressCircle progress={0} completed={false} label="Right" active={false} />
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-6">
                    The scan will auto-capture when you position your face correctly
                  </p>
                  
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                  >
                    <CameraIcon className="h-5 w-5" />
                    Start Face Scan
                  </button>
                </div>
              )}

              {cameraActive && faceStep !== "done" && (
                <div className="space-y-4">
                  {/* Progress circles */}
                  <div className="flex justify-center gap-6 mb-4">
                    <ProgressCircle 
                      progress={stepProgress[0]} 
                      completed={stepProgress[0] >= 100} 
                      label="Front" 
                      active={faceStep === "ready"} 
                    />
                    <ProgressCircle 
                      progress={stepProgress[1]} 
                      completed={stepProgress[1] >= 100} 
                      label="Left" 
                      active={faceStep === "left"} 
                    />
                    <ProgressCircle 
                      progress={stepProgress[2]} 
                      completed={stepProgress[2] >= 100} 
                      label="Right" 
                      active={faceStep === "right"} 
                    />
                  </div>
                  
                  {/* Camera view */}
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                    
                    {/* Face guide overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={`relative w-48 h-64 transition-all duration-300 ${
                        faceStep === "left" ? "-translate-x-8" :
                        faceStep === "right" ? "translate-x-8" : ""
                      }`}>
                        {/* Oval guide */}
                        <div className={`w-full h-full border-4 rounded-full transition-colors duration-200 ${
                          faceDetected && captureProgress > 0 
                            ? "border-green-400" 
                            : faceDetected 
                              ? "border-yellow-400" 
                              : "border-white/60"
                        }`} />
                        
                        {/* Progress ring */}
                        {captureProgress > 0 && (
                          <svg 
                            className="absolute inset-0 w-full h-full transform -rotate-90"
                            viewBox="0 0 100 130"
                          >
                            <ellipse
                              cx="50"
                              cy="65"
                              rx="48"
                              ry="62"
                              fill="none"
                              stroke="#22c55e"
                              strokeWidth="4"
                              strokeDasharray={`${captureProgress * 3.46} 346`}
                              className="drop-shadow-lg"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    {/* Direction arrows */}
                    {faceStep === "left" && (
                      <div className="absolute inset-0 flex items-center justify-start pl-8 pointer-events-none">
                        <div className="text-yellow-400 text-6xl animate-pulse">←</div>
                      </div>
                    )}
                    {faceStep === "right" && (
                      <div className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none">
                        <div className="text-yellow-400 text-6xl animate-pulse">→</div>
                      </div>
                    )}
                    
                    {/* Face detection indicator */}
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      faceDetected ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}>
                      {faceDetected ? "Face Detected ✓" : "No Face"}
                    </div>
                  </div>
                  
                  {/* Status message */}
                  <div className="text-center">
                    <p className="text-xl font-semibold text-gray-900 mb-1">
                      {instruction.title}
                    </p>
                    <p className={`text-sm font-medium ${
                      statusMessage.startsWith("✓") ? "text-green-600" : 
                      statusMessage.includes("Hold") ? "text-green-600" :
                      "text-gray-500"
                    }`}>
                      {statusMessage || instruction.desc}
                    </p>
                    
                    {/* Cancel button */}
                    <button
                      type="button"
                      onClick={resetFaceVerification}
                      className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {faceStep === "done" && (
                <div className="space-y-4">
                  {/* Completed progress circles */}
                  <div className="flex justify-center gap-6 mb-4">
                    <ProgressCircle progress={100} completed={true} label="Front" active={false} />
                    <ProgressCircle progress={100} completed={true} label="Left" active={false} />
                    <ProgressCircle progress={100} completed={true} label="Right" active={false} />
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircleIcon className="h-6 w-6" />
                    <span className="font-medium">Face scan complete!</span>
                  </div>
                  
                  {/* Preview captured images */}
                  <div className="grid grid-cols-3 gap-3">
                    {faceImages.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img}
                          alt={`Face ${idx + 1}`}
                          className="w-full aspect-square object-cover rounded-lg border-2 border-green-500"
                        />
                        <span className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                          {idx === 0 ? "Front" : idx === 1 ? "Left" : "Right"}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    type="button"
                    onClick={resetFaceVerification}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mx-auto"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    Redo face scan
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !idImage || !idVerified || faceImages.length < 3 || scanningId}
              className="w-full py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {uploadingId ? "Uploading ID..." : "Submitting..."}
                </>
              ) : scanningId ? (
                "Scanning ID..."
              ) : (
                "Submit for Verification"
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
