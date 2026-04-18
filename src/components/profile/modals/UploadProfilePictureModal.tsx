import React, { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { auth, storage, db } from '../../../services/firebase';
import { useTranslation } from '../../../contexts/LanguageContext';
import { modalBackdropDim, modalSurface, buttonPrimary, buttonSecondary } from '../../common/styles/ui';

// Local User type definition
type User = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
};

const XIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const ZoomInIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const ZoomOutIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

interface UploadProfilePictureModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    showPopup: (message: string) => void;
    file: File | null;
    onUploadSuccess: (newPhotoURL: string) => void;
}

const UploadProfilePictureModal: React.FC<UploadProfilePictureModalProps> = ({ isOpen, onClose, user, showPopup, file, onUploadSuccess }) => {
    const { t } = useTranslation();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setZoom(1);
            setUploadProgress(0);
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    const handleUpload = async () => {
        const firebaseUser = auth.currentUser;
        if (!file || !firebaseUser || !previewUrl) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new window.Image();
            img.crossOrigin = 'anonymous';

            const processedBlob = await new Promise<Blob | null>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Image processing timed out.')), 10000);
                img.onload = () => {
                    clearTimeout(timeout);
                    const CANVAS_SIZE = 512;
                    canvas.width = CANVAS_SIZE;
                    canvas.height = CANVAS_SIZE;
                    if (!ctx) return reject(new Error('Could not get canvas context.'));
                    const imgRatio = img.naturalWidth / img.naturalHeight;
                    const canvasRatio = CANVAS_SIZE / CANVAS_SIZE;
                    let drawnWidth, drawnHeight;
                    if (imgRatio > canvasRatio) {
                        drawnHeight = CANVAS_SIZE;
                        drawnWidth = drawnHeight * imgRatio;
                    } else {
                        drawnWidth = CANVAS_SIZE;
                        drawnHeight = drawnWidth / imgRatio;
                    }
                    const zoomedWidth = drawnWidth * zoom;
                    const zoomedHeight = drawnHeight * zoom;
                    const offsetX = (CANVAS_SIZE - zoomedWidth) / 2;
                    const offsetY = (CANVAS_SIZE - zoomedHeight) / 2;
                    ctx.drawImage(img, offsetX, offsetY, zoomedWidth, zoomedHeight);
                    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob returned null.')), 'image/jpeg', 0.9);
                };
                img.onerror = (err) => { clearTimeout(timeout); reject(err); };
                img.src = previewUrl;
            });

            if (!processedBlob) throw new Error('Failed to create image blob.');

            const storageRef = storage.ref(`profile-pictures/${firebaseUser.uid}/avatar.jpg`);
            const uploadTask = storageRef.put(processedBlob);

            uploadTask.on('state_changed', (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            });

            await uploadTask;

            const newPhotoURL = await uploadTask.snapshot.ref.getDownloadURL();
            
            await firebaseUser.updateProfile({ photoURL: newPhotoURL });
            
            if (firebaseUser.uid) {
                const personnelDocRef = db.collection('personnel').doc(firebaseUser.uid);
                await personnelDocRef.update({ photoURL: newPhotoURL });
            }
            
            showPopup(t('profileUpdateSuccess'));
            onUploadSuccess(newPhotoURL);

        } catch (error: any) {
            console.error("Error uploading profile picture:", error);
            let errorMessage = t('uploadPictureFailed');
            if (error.code === 'storage/unauthorized') {
                errorMessage = "Upload failed: Permission denied. Please check storage rules and CORS configuration.";
            }
            showPopup(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-pic-modal-title"
        >
            <div className={`${modalBackdropDim} animate-fade-in`} aria-hidden="true" />
            <div 
                className={`${modalSurface} p-6 sm:p-8 w-full max-w-md transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 id="upload-pic-modal-title" className="text-xl sm:text-2xl font-bold">
                        {t('uploadProfilePicture')}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors" aria-label={t('closeModal')}>
                        <XIcon />
                    </button>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{t('uploadPictureSubtext')}</p>
                    {previewUrl && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-48 h-48 rounded-full overflow-hidden shadow-lg border-4 border-yellow-400 bg-gray-200 dark:bg-gray-700">
                                <NextImage
                                    src={previewUrl}
                                    alt="Profile preview"
                                    width={192}
                                    height={192}
                                    className="w-full h-full object-cover transition-transform duration-100 ease-linear"
                                    style={{ transform: `scale(${zoom})` }}
                                    unoptimized
                                />
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center transition-opacity duration-300">
                                        <div className="w-3/4 bg-gray-600 rounded-full h-2">
                                            <div className="bg-white h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                        <p className="text-white font-bold mt-2 text-sm">{Math.round(uploadProgress)}%</p>
                                    </div>
                                )}
                            </div>
                            {!isUploading && (
                                <div className="w-full max-w-[250px] flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <button
                                        type="button"
                                        onClick={() => setZoom(z => Math.max(1, z - 0.1))}
                                        className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                        aria-label={t('zoomOut', 'Zoom out')}
                                    >
                                        <ZoomOutIcon />
                                    </button>
                                    <input
                                        id="zoom-slider"
                                        type="range"
                                        min="1"
                                        max="2.5"
                                        step="0.01"
                                        value={zoom}
                                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-300/80 dark:bg-gray-600/80 rounded-lg appearance-none cursor-pointer"
                                        aria-label={t('zoomSlider', 'Zoom slider')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setZoom(z => Math.min(2.5, z + 0.1))}
                                        className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                        aria-label={t('zoomIn', 'Zoom in')}
                                    >
                                        <ZoomInIcon />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                    <button type="button" onClick={onClose} disabled={isUploading} className={`${buttonSecondary} disabled:opacity-50`}>
                        {t('cancel')}
                    </button>
                    <button onClick={handleUpload} disabled={isUploading} className={`${buttonPrimary} shadow-lg shadow-blue-600/30 disabled:bg-blue-400 disabled:cursor-not-allowed`}>
                        {isUploading ? `${t('uploading')}...` : t('upload')}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                @keyframes fade-in-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default UploadProfilePictureModal;
