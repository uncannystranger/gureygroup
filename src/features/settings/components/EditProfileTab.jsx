import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Camera, 
  Upload, 
  Crop, 
  Trash2, 
  Link as LinkIcon, 
  Save, 
  Loader2, 
  Check, 
  Phone, 
  AlertCircle
} from 'lucide-react';
import { useUserProfile } from '../../../core/user/UserProfileContext';
import { useLanguage } from '../../../localization/LanguageContext';
import CameraModal from './CameraModal';
import CropZoomModal from './CropZoomModal';

export default function EditProfileTab() {
  const { profile, saveProfile } = useUserProfile();
  const { t } = useLanguage();

  const [formState, setFormState] = useState({ ...profile });
  const [initialState, setInitialState] = useState({ ...profile });
  
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    setFormState({ ...profile });
    setInitialState({ ...profile });
  }, [profile]);

  // Check unsaved changes
  const isDirty = JSON.stringify(formState) !== JSON.stringify(initialState);

  const handleChange = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  // Immediately persist a photo change to RTDB + Storage
  // so the user doesn't need to also click "Save Changes"
  const handlePhotoChange = async (photoValue) => {
    handleChange('photo', photoValue);
    // Persist immediately — don't wait for "Save Changes"
    setIsSaving(true);
    try {
      await saveProfile({ photo: photoValue });
    } catch (err) {
      console.warn('Photo save failed:', err);
    }
    setIsSaving(false);
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WEBP, GIF).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      handlePhotoChange(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleValidateAndApplyUrl = () => {
    if (!urlInput.trim()) return;
    setUrlError('');
    setIsValidatingUrl(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setIsValidatingUrl(false);
      handlePhotoChange(urlInput.trim());
      setUrlInput('');
    };
    img.onerror = () => {
      setIsValidatingUrl(false);
      setUrlError('Unable to load image from URL. Ensure it points to a direct public image link.');
    };
    img.src = urlInput.trim();
  };

  const handleRemovePhoto = () => {
    handlePhotoChange('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isDirty) return;

    setIsSaving(true);
    try {
      await saveProfile({
        photo: formState.photo,
        firstName: formState.firstName,
        lastName: formState.lastName,
        displayName: formState.displayName,
        phone: formState.phone,
        address: formState.address,
        dateOfBirth: formState.dateOfBirth,
        gender: formState.gender,
        preferredLanguage: formState.preferredLanguage,
      });
      setInitialState({ ...formState });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Profile Photo Management Card */}
      <div className="glass-panel rounded-4xl p-6 space-y-5 card-hover-lift">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-500" /> {t('settings.change_photo', 'Profile Avatar & Photo Management')}
        </h3>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          
          {/* Avatar Preview with Interactive Micro-Animations */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 border-2 border-indigo-500/50 group-hover:border-indigo-500 transition-all duration-300 shadow-xl overflow-hidden bg-slate-900">
              <img 
                src={formState.photo} 
                alt="Profile Avatar" 
                className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            {/* Hover Camera Overlay Icon */}
            <button
              type="button"
              onClick={() => setIsCropOpen(true)}
              className="absolute inset-0 rounded-full bg-slate-950/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200 cursor-pointer"
              title="Crop & Edit Photo"
            >
              <Crop className="w-6 h-6 mb-1 drop-shadow-md" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Adjust</span>
            </button>
          </div>

          {/* Photo Upload Methods Grid */}
          <div className="flex-1 space-y-4 w-full">
            
            {/* Drag & Drop Zone */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-4 rounded-3xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 scale-[1.01] shadow-lg ring-2 ring-indigo-500/20' 
                  : 'border-slate-300 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 hover:bg-white/70 dark:hover:bg-slate-800/70'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-6 h-6 text-indigo-500 animate-pulse" />
              <div className="text-xs">
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">Upload a file</span>
                <span className="text-slate-500"> or drag and drop</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">PNG, JPG, WEBP or GIF up to 10MB</p>
              
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
                className="hidden"
              />
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="px-3.5 py-2 rounded-2xl glass-pill text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:scale-105 transition-all btn-micro"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-500" /> Use Camera
              </button>

              <button
                type="button"
                onClick={() => setIsCropOpen(true)}
                className="px-3.5 py-2 rounded-2xl glass-pill text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:scale-105 transition-all btn-micro"
              >
                <Crop className="w-3.5 h-3.5 text-indigo-500" /> Crop & Zoom
              </button>

              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-3.5 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-all btn-micro"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.delete', 'Remove')}
              </button>
            </div>

            {/* Image URL Input with Live Validation */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Or Paste Image URL (Unsplash, Google, Direct JPG/PNG/WEBP)
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleValidateAndApplyUrl}
                  disabled={!urlInput.trim() || isValidatingUrl}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md disabled:opacity-50 hover:bg-indigo-700 transition-all shrink-0 flex items-center gap-1 btn-micro"
                >
                  {isValidatingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply URL'}
                </button>
              </div>

              {urlError && (
                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1 animate-shake">
                  <AlertCircle className="w-3.5 h-3.5" /> {urlError}
                </p>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Profile Details Form Section */}
      <div className="glass-panel rounded-4xl p-6 space-y-4 card-hover-lift">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-500" /> Edit Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
          
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('settings.first_name', 'First Name')}</label>
            <input
              type="text"
              value={formState.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/40 focus:outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('settings.last_name', 'Last Name')}</label>
            <input
              type="text"
              value={formState.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/40 focus:outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('settings.display_name', 'Display Name')}</label>
            <input
              type="text"
              value={formState.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/40 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold flex items-center gap-1">
              <Phone className="w-3 h-3 text-indigo-500" /> {t('settings.phone_number', 'Phone Number')}
            </label>
            <input
              type="tel"
              value={formState.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/40 focus:outline-none transition-all"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('settings.address', 'Address')}</label>
            <input
              type="text"
              value={formState.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/40 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('settings.date_of_birth', 'Date of Birth')}</label>
            <input
              type="date"
              value={formState.dateOfBirth || ''}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/40 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('settings.gender', 'Gender')}</label>
            <select
              value={formState.gender || ''}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/40 focus:outline-none transition-all"
            >
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non_binary">Non-binary</option>
              <option value="self_describe">Self-describe</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('settings.preferred_language', 'Preferred Language')}</label>
            <select
              value={formState.preferredLanguage}
              onChange={(e) => handleChange('preferredLanguage', e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/40 focus:outline-none transition-all"
            >
              <option value="English (US)">English (US)</option>
              <option value="Somali (🇸🇴)">Somali (🇸🇴)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Save Control Bar */}
      <div className="flex items-center justify-between p-4 rounded-3xl glass-panel border border-white/60 dark:border-white/10">
        <div className="text-xs">
          {isDirty ? (
            <span className="font-extrabold text-amber-500 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Unsaved changes detected
            </span>
          ) : (
            <span className="font-bold text-slate-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> All profile changes saved
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={!isDirty || isSaving}
          className="px-6 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:hover:scale-100 flex items-center gap-2 btn-micro"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Saving Profile...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{t('common.save', 'Save Changes')}</span>
            </>
          )}
        </button>
      </div>

      {/* Camera & Crop Modals */}
      <CameraModal 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(imgData) => handlePhotoChange(imgData)}
      />

      <CropZoomModal 
        isOpen={isCropOpen}
        imageSrc={formState.photo}
        onClose={() => setIsCropOpen(false)}
        onSave={(croppedData) => handlePhotoChange(croppedData)}
      />

    </form>
  );
}
