import React, { useCallback, useEffect, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import Dialog from './ui/Dialog';
import Button from './ui/Button';

interface AvatarCropModalProps {
    file: File | null;
    saving: boolean;
    onCancel: () => void;
    onSave: (blob: Blob) => void;
}

function getCroppedBlob(imageSrc: string, area: Area): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = area.width;
            canvas.height = area.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas is not supported'));
                return;
            }
            ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
            canvas.toBlob(
                (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process the image"))),
                'image/jpeg',
                0.92
            );
        };
        image.onerror = () => reject(new Error("Couldn't load the image"));
        image.src = imageSrc;
    });
}

// Reusable pick-a-file -> crop-round-preview -> save-as-blob step, shared by
// every avatar upload site (profile, group create, group settings). The
// caller owns the actual upload -- this only ever hands back a cropped Blob.
function AvatarCropModal({ file, saving, onCancel, onSave }: AvatarCropModalProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    useEffect(() => {
        if (!file) {
            setImageSrc(null);
            return undefined;
        }
        const url = URL.createObjectURL(file);
        setImageSrc(url);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleCropComplete = useCallback((_area: Area, pixels: Area) => {
        setCroppedAreaPixels(pixels);
    }, []);

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels || saving) return;
        try {
            const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
            onSave(blob);
        } catch {
            // The upload-side toast handles surfacing failures to the user.
        }
    };

    return (
        <Dialog open={!!file && !!imageSrc} onClose={onCancel} title="Crop your photo" width={400} dismissible={!saving}>
            {imageSrc && (
                <div className="avatar-crop-area">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={handleCropComplete}
                    />
                </div>
            )}
            <input
                type="range"
                className="avatar-crop-zoom"
                aria-label="Zoom"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                disabled={saving}
                onChange={(e) => setZoom(Number(e.target.value))}
            />
            <div className="ui-dialog__actions">
                <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} loading={saving} disabled={!croppedAreaPixels}>
                    {saving ? 'Saving' : 'Save photo'}
                </Button>
            </div>
        </Dialog>
    );
}

export default AvatarCropModal;
