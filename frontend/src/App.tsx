"use client"

import type React from "react"
import {useEffect, useRef, useState} from "react"
import {Card, CardContent, CardHeader, CardTitle} from "./components/ui/card"
import {Button} from "./components/ui/button"
import {Input} from "./components/ui/input"
import {Label} from "./components/ui/label"
import {Separator} from "./components/ui/separator"
import {Badge} from "./components/ui/badge"
import {Contrast, Download, Palette, RotateCcw, RotateCw, ScalingIcon as Resize, Upload, X} from "lucide-react"

interface Operation {
    id: string
    type: string
    direction?: string
    percent?: number
}

export default function ImageConverter() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [result, setResult] = useState<string | null>(null)
    const [operations, setOperations] = useState<Operation[]>([])
    const [resizePercent, setResizePercent] = useState<number>(100)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            const reader = new FileReader()
            reader.onload = (e) => {
                setSelectedImage(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const addOperation = (operation: Omit<Operation, "id">) => {
        const newOperation = {
            ...operation,
            id: Math.random().toString(36).substr(2, 9),
        }
        setOperations([...operations, newOperation])
    }

    const removeOperation = (id: string) => {
        setOperations(operations.filter((op) => op.id !== id))
    }

    const clearAllOperations = () => {
        setOperations([])
    }

    const generateJSON = () => {
        return operations.map(({type, direction, percent}) => {
            if (type === "rotate") {
                return {type, direction};
            }
            if (type === "resize") {
                return {type, percent};
            }
            // For invert and grayscale, only send type
            return {type};
        });
    };

    const getOperationLabel = (operation: Operation) => {
        switch (operation.type) {
            case "invert":
                return "Invert Colors"
            case "grayscale":
                return "Grayscale"
            case "rotate":
                return `Rotate ${operation.direction === "left" ? "Left" : "Right"}`
            case "resize":
                return `Resize ${operation.percent}%`
            default:
                return operation.type
        }
    }

    // Real-time image processing
    useEffect(() => {
        if (!selectedFile) {
            setResult(null)
            return
        }
        const processImage = async () => {
            setIsProcessing(true)
            setResult(null)
            try {
                const formData = new FormData()
                formData.append("file", selectedFile)
                // Always send transformations, even if empty
                formData.append("transformations", JSON.stringify(generateJSON()))
                const res = await fetch("http://localhost:8080/transform", {
                    method: "POST",
                    body: formData,
                })
                if (res.ok) {
                    const blob = await res.blob()
                    setResult(URL.createObjectURL(blob))
                } else {
                    setResult(null)
                    alert("Image processing failed")
                }
            } catch (error) {
                setResult(null)
                alert("Image processing failed")
            } finally {
                setIsProcessing(false)
            }
        }
        processImage()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [operations, selectedFile])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Image Converter</h1>
                    <p className="text-slate-600">Transform your images with powerful editing tools</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Upload Section */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="w-5 h-5"/>
                                Upload Image
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {selectedImage ? (
                                    <div className="space-y-4">
                                        <img
                                            src={selectedImage || "/placeholder.svg"}
                                            alt="Selected"
                                            className="max-w-full max-h-48 mx-auto rounded-lg shadow-sm"
                                        />
                                        <Button variant="outline" size="sm">
                                            Change Image
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <Upload className="w-12 h-12 text-slate-400 mx-auto"/>
                                        <div>
                                            <p className="text-slate-600 font-medium">Click to upload an image</p>
                                            <p className="text-sm text-slate-500">PNG, JPG, GIF up to 10MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden"/>
                        </CardContent>
                    </Card>

                    {/* Controls Section */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Transform Controls</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Color Operations */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-700">Color Effects</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addOperation({type: "invert"})}
                                        className="flex items-center gap-2"
                                    >
                                        <Contrast className="w-4 h-4"/>
                                        Invert
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addOperation({type: "grayscale"})}
                                        className="flex items-center gap-2"
                                    >
                                        <Palette className="w-4 h-4"/>
                                        Grayscale
                                    </Button>
                                </div>
                            </div>

                            <Separator/>

                            {/* Rotation */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-700">Rotation</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addOperation({type: "rotate", direction: "left"})}
                                        className="flex items-center gap-2"
                                    >
                                        <RotateCcw className="w-4 h-4"/>
                                        Left
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addOperation({type: "rotate", direction: "right"})}
                                        className="flex items-center gap-2"
                                    >
                                        <RotateCw className="w-4 h-4"/>
                                        Right
                                    </Button>
                                </div>
                            </div>

                            <Separator/>

                            {/* Resize */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-700">Resize</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={resizePercent}
                                        onChange={(e) => setResizePercent(Number(e.target.value))}
                                        min="1"
                                        max="500"
                                        className="flex-1"
                                    />
                                    <span className="text-sm text-slate-500">%</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addOperation({type: "resize", percent: resizePercent})}
                                        className="flex items-center gap-2"
                                    >
                                        <Resize className="w-4 h-4"/>
                                        Apply
                                    </Button>
                                </div>
                            </div>

                            <Separator/>

                            {/* Operations Queue */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold text-slate-700">Operations Queue</Label>
                                    {operations.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearAllOperations}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            Clear All
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {operations.length === 0 ? (
                                        <p className="text-sm text-slate-500 text-center py-4">No operations added</p>
                                    ) : (
                                        operations.map((operation) => (
                                            <div key={operation.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {getOperationLabel(operation)}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeOperation(operation.id)}
                                                    className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                                                >
                                                    <X className="w-3 h-3"/>
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Output Section */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Output</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm min-h-[200px]">
                                    <pre className="whitespace-pre-wrap">{JSON.stringify(generateJSON(), null, 2)}</pre>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        type="button"
                                        onClick={() => navigator.clipboard.writeText(JSON.stringify(generateJSON(), null, 2))}
                                        className="flex-1"
                                    >
                                        Copy JSON
                                    </Button>
                                    <Button
                                        size="sm"
                                        type="button"
                                        className="flex-1 flex items-center gap-2"
                                        disabled
                                    >
                                        <Download className="w-4 h-4"/>
                                        Processing is automatic
                                    </Button>
                                </div>

                                {result && (
                                    <div className="mt-4">
                                        <h4 className="font-semibold mb-2">Processed Image:</h4>
                                        <div className="border rounded-lg p-2 bg-white">
                                            <img
                                                src={result || "/placeholder.svg"}
                                                alt="Processed result"
                                                className="max-w-full h-auto rounded"
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2 w-full bg-transparent"
                                            onClick={() => {
                                                const link = document.createElement("a")
                                                link.href = result
                                                link.download = "processed-image.png"
                                                link.click()
                                            }}
                                        >
                                            Download Image
                                        </Button>
                                    </div>
                                )}
                                {isProcessing && (
                                    <div className="flex items-center gap-2 mt-2 text-slate-600">
                                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"/>
                                        Processing...
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}