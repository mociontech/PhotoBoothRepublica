import { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import { storage } from "../firebase/config";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

const PhotoCam = () => {
  const webcamRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const navigate = useNavigate();
  const cameraRef = useRef(null);

  const uploadToFirebase = async (base64Image) => {
    try {
      const storageRef = ref(storage, `images/${Date.now()}.jpg`);
      await uploadString(storageRef, base64Image, "data_url");
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
      console.log("Image URL:", url);
      return url;
    } catch (error) {
      console.error("Error uploading image to Firebase", error);
    }
  };

  const capture = useCallback(() => {
    if (cameraRef.current) {
      html2canvas(cameraRef.current).then((canvas) => {
        const finalImage = canvas.toDataURL('image/jpeg');
        setCapturedImage(finalImage);
        uploadToFirebase(finalImage);
      });
    }
  }, [cameraRef]);

  useEffect(() => {
    if (isCameraReady && timeLeft === 0) {
      capture();
    } else if (isCameraReady && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [isCameraReady, timeLeft, capture]);

  useEffect(() => {
    const checkCameraReady = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setIsCameraReady(true);
      } catch (error) {
        setIsCameraReady(false);
      }
    };

    checkCameraReady();
  }, []);

  const retakePhoto = () => {
    setCapturedImage(null);
    setImageUrl(null);
    setTimeLeft(5);
  };

  const handlerNext = () => {
    navigate("/register", { state: { image: imageUrl } });
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen">
      {!isCameraReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80">
          <div className="text-xl font-bold text-gray-700 bg-gray-200 p-4 rounded-md shadow-md">
            Loading...
          </div>
        </div>
      )}
      <div
        className={`flex flex-col items-center p-6 bg-white border rounded-md shadow-md ${
          !isCameraReady ? "opacity-0" : ""
        }`}
      >
        {isCameraReady && !capturedImage && (
          <>
            <h1 className="text-2xl font-bold mb-4">Photo</h1>
            <div ref={cameraRef}>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="mb-4"
              />
            </div>
          </>
        )}
        {capturedImage && (
          <div className="flex flex-col items-center">
            <img src={capturedImage} alt="Captura" className="mb-4" />
          </div>
        )}
        <div>
          {timeLeft > 0 && (
            <div className="text-3xl font-bold mb-4">{timeLeft}</div>
          )}
        </div>
        <div>
          <button
            onClick={retakePhoto}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-4"
          >
            Retake pic
          </button>
          <button
            onClick={handlerNext}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 "
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoCam;
