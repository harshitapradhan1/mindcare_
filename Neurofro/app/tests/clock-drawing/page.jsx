"use client";
import { useState, useRef, useEffect } from "react";
import { Clock, CheckCircle, ArrowRight, RotateCcw, ChevronRight, Eraser } from "lucide-react";
import Link from "next/link";
import TestResultNavigation from "@/components/TestResultNavigation";

export default function ClockDrawingTest() {
  const [phase, setPhase] = useState("instructions"); // instructions | drawing | results
  const [score, setScore] = useState(null);
  const [drawingData, setDrawingData] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState("hand"); // hand | number | erase
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [numbers, setNumbers] = useState({});
  const [hourHand, setHourHand] = useState({ x: 0, y: 0 });
  const [minuteHand, setMinuteHand] = useState({ x: 0, y: 0 });
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [radius, setRadius] = useState(0);

  useEffect(() => {
    if (phase === "drawing" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const r = Math.min(centerX, centerY) - 20;
      
      setCenter({ x: centerX, y: centerY });
      setRadius(r);
      
      // Draw clock face
      drawClockFace(ctx, centerX, centerY, r);
    }
  }, [phase]);

  const drawClockFace = (ctx, cx, cy, r) => {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw outer circle
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw inner circle
    ctx.strokeStyle = "#6b7280";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 5, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const drawNumbers = (ctx, cx, cy, r, nums) => {
    Object.entries(nums).forEach(([num, pos]) => {
      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(num, pos.x, pos.y);
    });
  };

  const drawHands = (ctx, cx, cy, hourHandPos, minuteHandPos) => {
    // Hour hand
    if (hourHandPos.x !== 0 || hourHandPos.y !== 0) {
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(hourHandPos.x, hourHandPos.y);
      ctx.stroke();
    }
    
    // Minute hand
    if (minuteHandPos.x !== 0 || minuteHandPos.y !== 0) {
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(minuteHandPos.x, minuteHandPos.y);
      ctx.stroke();
    }
  };

  const redrawCanvas = () => {
    if (!canvasRef.current || !center.x) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x: cx, y: cy } = center;
    const r = radius;
    
    drawClockFace(ctx, cx, cy, r);
    drawNumbers(ctx, cx, cy, r, numbers);
    drawHands(ctx, cx, cy, hourHand, minuteHand);
  };

  useEffect(() => {
    redrawCanvas();
  }, [numbers, hourHand, minuteHand, center, radius]);

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleCanvasClick = (e) => {
    if (!center.x) return;
    
    const pos = getCanvasCoordinates(e);
    const { x: cx, y: cy } = center;
    const r = radius;
    
    if (drawMode === "number" && selectedNumber) {
      // Place number
      const distance = Math.sqrt(Math.pow(pos.x - cx, 2) + Math.pow(pos.y - cy, 2));
      if (distance <= r + 20) {
        setNumbers((prev) => ({
          ...prev,
          [selectedNumber]: pos,
        }));
        setSelectedNumber(null);
      }
    } else if (drawMode === "hand") {
      // Place hand
      const distance = Math.sqrt(Math.pow(pos.x - cx, 2) + Math.pow(pos.y - cy, 2));
      if (distance <= r + 20) {
        // Determine which hand based on which is closer to 11:10 position
        const targetHourAngle = ((11 % 12) / 12) * 360 + (10 / 60) * 30;
        const targetMinuteAngle = (10 / 60) * 360;
        
        const clickAngle = Math.atan2(pos.y - cy, pos.x - cx) * (180 / Math.PI) + 90;
        const normalizedClickAngle = clickAngle < 0 ? clickAngle + 360 : clickAngle;
        
        const hourDist = Math.abs(normalizedClickAngle - targetHourAngle);
        const minuteDist = Math.abs(normalizedClickAngle - targetMinuteAngle);
        
        if (hourDist < minuteDist) {
          setHourHand(pos);
        } else {
          setMinuteHand(pos);
        }
      }
    }
  };

  const calculateScore = () => {
    if (!center.x) return 0;
    
    const { x: cx, y: cy } = center;
    const r = radius;
    
    let score = 0;
    const maxScore = 100;
    
    // Score number placement (40 points)
    const expectedNumbers = 12;
    const placedNumbers = Object.keys(numbers).length;
    const numberScore = (placedNumbers / expectedNumbers) * 40;
    score += numberScore;
    
    // Score number accuracy (30 points)
    let numberAccuracy = 0;
    const expectedAngles = {};
    for (let i = 1; i <= 12; i++) {
      const angle = ((i % 12) * 30 - 90) * (Math.PI / 180);
      expectedAngles[i] = {
        x: cx + r * 0.85 * Math.cos(angle),
        y: cy + r * 0.85 * Math.sin(angle),
      };
    }
    
    Object.entries(numbers).forEach(([num, pos]) => {
      const expected = expectedAngles[parseInt(num)];
      if (expected) {
        const distance = Math.sqrt(
          Math.pow(pos.x - expected.x, 2) + Math.pow(pos.y - expected.y, 2)
        );
        const maxDistance = r * 0.3;
        numberAccuracy += Math.max(0, 1 - distance / maxDistance);
      }
    });
    score += (numberAccuracy / 12) * 30;
    
    // Score hand placement (30 points)
    const targetHourAngle = ((11 % 12) / 12) * 360 + (10 / 60) * 30;
    const targetMinuteAngle = (10 / 60) * 360;
    
    let handScore = 0;
    
    if (hourHand.x !== 0 || hourHand.y !== 0) {
      const hourAngle = Math.atan2(hourHand.y - cy, hourHand.x - cx) * (180 / Math.PI) + 90;
      const normalizedHourAngle = hourAngle < 0 ? hourAngle + 360 : hourAngle;
      const hourError = Math.abs(normalizedHourAngle - targetHourAngle);
      const hourErrorNormalized = Math.min(hourError, 360 - hourError);
      handScore += Math.max(0, 1 - hourErrorNormalized / 30) * 15;
    }
    
    if (minuteHand.x !== 0 || minuteHand.y !== 0) {
      const minuteAngle = Math.atan2(minuteHand.y - cy, minuteHand.x - cx) * (180 / Math.PI) + 90;
      const normalizedMinuteAngle = minuteAngle < 0 ? minuteAngle + 360 : minuteAngle;
      const minuteError = Math.abs(normalizedMinuteAngle - targetMinuteAngle);
      const minuteErrorNormalized = Math.min(minuteError, 360 - minuteError);
      handScore += Math.max(0, 1 - minuteErrorNormalized / 30) * 15;
    }
    
    score += handScore;
    
    return Math.min(maxScore, Math.max(0, score));
  };

  const handleSubmit = async () => {
    const drawingScore = calculateScore();
    setScore(drawingScore);
    
    const drawingData = {
      numbers: numbers,
      hourHand: hourHand,
      minuteHand: minuteHand,
      score: drawingScore,
    };
    setDrawingData(drawingData);
    setPhase("results");

    const userId =
      typeof window !== "undefined"
        ? localStorage.getItem("userId") || "demo-user-123"
        : "demo-user-123";
    const API_BASE =
      typeof window !== "undefined" ? "/api/backend" : "http://localhost:5002/api";

    try {
      await fetch(`${API_BASE}/neurotwin/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          test_results: {
            test_type: "clock-drawing",
            drawing_score: drawingScore,
            numbers_placed: Object.keys(numbers).length,
            hour_hand_placed: hourHand.x !== 0 || hourHand.y !== 0,
            minute_hand_placed: minuteHand.x !== 0 || minuteHand.y !== 0,
          },
        }),
      });
    } catch (err) {
      console.error("Error submitting clock drawing:", err);
    }
  };

  const resetDrawing = () => {
    setNumbers({});
    setHourHand({ x: 0, y: 0 });
    setMinuteHand({ x: 0, y: 0 });
    setSelectedNumber(null);
    redrawCanvas();
  };

  if (phase === "instructions") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-amber-100">
          <Link
            href="/tests"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-4 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span className="font-semibold">Back to Tests</span>
          </Link>
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-lg">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Clock Drawing Activity</h1>
            </div>
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 mb-6 text-left">
              <h3 className="font-bold text-gray-900 mb-3">How it works</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Draw a clock showing the time <span className="font-semibold">&apos;10 past 11&apos;</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Place the numbers 1-12 around the clock face</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Draw the hour and minute hands to show 10 past 11</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>This activity assesses planning, attention, and visual organization skills</span>
                </li>
              </ul>
            </div>
            <p className="text-xs text-gray-500 mb-6 italic">
              These activities are designed for self-awareness and cognitive tracking. They are not medical tests or diagnoses.
            </p>
            <button
              onClick={() => setPhase("drawing")}
              className="w-full px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <ChevronRight className="w-6 h-6" />
              Start Drawing
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "drawing" && score === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-5xl w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-amber-100">
          <Link
            href="/tests"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-4 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span className="font-semibold">Back to Tests</span>
          </Link>
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-lg">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Clock Drawing</h1>
            </div>
            <p className="text-gray-600 mb-4">
              Draw a clock showing the time <span className="font-semibold">10 past 11</span>
            </p>
          </div>

          {/* Drawing Tools */}
          <div className="bg-amber-50 rounded-xl p-4 mb-6 border-2 border-amber-200">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Mode:</span>
                <button
                  onClick={() => setDrawMode("number")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    drawMode === "number"
                      ? "bg-amber-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300"
                  }`}
                >
                  Numbers
                </button>
                <button
                  onClick={() => setDrawMode("hand")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    drawMode === "hand"
                      ? "bg-amber-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300"
                  }`}
                >
                  Hands
                </button>
                <button
                  onClick={resetDrawing}
                  className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>

            {drawMode === "number" && (
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">Select number to place:</div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <button
                      key={num}
                      onClick={() => setSelectedNumber(num)}
                      className={`w-10 h-10 rounded-lg font-bold transition-all ${
                        selectedNumber === num
                          ? "bg-amber-600 text-white scale-110 shadow-lg"
                          : numbers[num]
                          ? "bg-green-100 text-green-700 border-2 border-green-400"
                          : "bg-white text-gray-700 border border-gray-300 hover:border-amber-400"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                {selectedNumber && (
                  <p className="text-xs text-gray-600 mt-2">
                    Click on the clock face to place number {selectedNumber}
                  </p>
                )}
              </div>
            )}

            {drawMode === "hand" && (
              <div>
                <p className="text-sm text-gray-700">
                  Click on the clock face to place the hour hand (red) and minute hand (blue) to show 10 past 11
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                    <span className="text-xs text-gray-600">Hour hand</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                    <span className="text-xs text-gray-600">Minute hand</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="flex justify-center mb-6">
            <canvas
              ref={canvasRef}
              width={500}
              height={500}
              onClick={handleCanvasClick}
              className="border-2 border-gray-300 rounded-xl cursor-crosshair bg-white shadow-lg"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Numbers placed: {Object.keys(numbers).length}/12
            </div>
            <button
              onClick={handleSubmit}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-xl"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Submit Clock</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "results" && score !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-amber-100 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8 text-amber-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Clock Drawing Saved
              </h2>
            </div>
            <p className="text-gray-600 mb-6 text-sm">
              Your drawing has been saved for your personal record. Over time, you&apos;ll see how your drawings change.
            </p>
            <p className="text-xs text-gray-500 mb-6 italic">
              These activities are designed for self-awareness and cognitive tracking. They are not medical tests or diagnoses.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-6 border-2 border-amber-300">
                <div className="text-xs text-amber-800 font-semibold mb-2">Overall Score</div>
                <div className="text-4xl font-bold text-amber-900">
                  {score.toFixed(0)}
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl p-6 border-2 border-emerald-300">
                <div className="text-xs text-emerald-800 font-semibold mb-2">Numbers Placed</div>
                <div className="text-4xl font-bold text-emerald-900">
                  {Object.keys(numbers).length}
                </div>
                <div className="text-xs text-emerald-700 mt-1">out of 12</div>
              </div>
              <div className="bg-gradient-to-br from-red-100 to-rose-100 rounded-xl p-6 border-2 border-red-300">
                <div className="text-xs text-red-800 font-semibold mb-2">Hour Hand</div>
                <div className="text-4xl font-bold text-red-900">
                  {hourHand.x !== 0 || hourHand.y !== 0 ? "✓" : "✗"}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-6 border-2 border-blue-300">
                <div className="text-xs text-blue-800 font-semibold mb-2">Minute Hand</div>
                <div className="text-4xl font-bold text-blue-900">
                  {minuteHand.x !== 0 || minuteHand.y !== 0 ? "✓" : "✗"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Link
              href="/tests"
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-5 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
            >
              <span>Back to Tests</span>
              <ChevronRight className="w-6 h-6" />
            </Link>
            <button
              onClick={() => {
                setPhase("drawing");
                setScore(null);
                resetDrawing();
              }}
              className="flex-1 bg-white hover:bg-gray-50 text-amber-600 border-2 border-amber-600 font-bold py-5 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg"
            >
              <RotateCcw className="w-6 h-6" />
              <span>Retake Test</span>
            </button>
          </div>

          <TestResultNavigation 
            testName="Clock Drawing" 
            score={score} 
          />
        </div>
      </div>
    );
  }

  return null;
}
