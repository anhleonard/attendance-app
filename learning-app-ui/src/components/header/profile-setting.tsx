import Button from '@/lib/button';
import TextField from '@/lib/textfield';
import React from 'react'

const ProfileSetting = () => {
  return (
      <div className='text-grey-c900 flex flex-col gap-5 px-2 py-3'>
        <div className="flex flex-col items-center gap-3">
            <div className="relative">
            <div 
                className="w-24 h-24 rounded-full flex items-center justify-center bg-white text-primary-c700 border-[1.5px] border-primary-c200 text-xl lg:text-2xl font-semibold"
                id="preview-avatar-container"
            >
                <img 
                    src="/default-avatar.png" 
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover border-[1.5px] border-primary-c200 hidden"
                    id="preview-avatar"
                />
                <span id="avatar-letter">AN</span>
            </div>
            <label htmlFor="avatar-input" className="absolute bottom-0 right-0 bg-primary-c700 p-1.5 rounded-full cursor-pointer hover:bg-primary-c800 active:bg-primary-c900 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
            </label>
            <input 
                type="file" 
                id="avatar-input"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                    // Check file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                        alert('File size should not exceed 5MB');
                        e.target.value = '';
                        return;
                    }

                    // Check file type
                    if (!file.type.startsWith('image/')) {
                        alert('Please select an image file');
                        e.target.value = '';
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const preview = document.getElementById('preview-avatar') as HTMLImageElement;
                        const container = document.getElementById('preview-avatar-container');
                        const letterElement = document.getElementById('avatar-letter');
                        if (preview && container && letterElement && e.target?.result) {
                            preview.src = e.target.result as string;
                            preview.classList.remove('hidden');
                            letterElement.classList.add('hidden');
                        }
                    };
                    reader.onerror = () => {
                        alert('Error reading file');
                        e.target.value = '';
                    };
                    reader.readAsDataURL(file);
                }
                }}
            />
            </div>
        </div>
        <TextField label="Name" defaultValue='Anh Leonard' inputClassName='font-questrial' />
        <TextField label="Email" defaultValue='anhtt@gmail.com' disabled />
        <div className='flex justify-end'>
            <Button label='Save'  className='py-2.5 px-6'/>
        </div>
    </div>
  )
}

export default ProfileSetting;