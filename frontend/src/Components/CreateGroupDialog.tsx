import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { groupNameSchema, createGroupSchema } from '@ciphersprint/shared';
import Avatar from './Avatar';
import AvatarCropModal from './AvatarCropModal';
import Dialog from './ui/Dialog';
import Input from './ui/Input';
import Button from './ui/Button';
import Icon from './ui/Icon';
import { useSocial } from '../Context/SocialContext';
import { api } from '../Utils/api';
import { uploadImage } from '../Utils/upload';

interface CreateGroupDialogProps {
    open: boolean;
    onClose: () => void;
}

function CreateGroupDialog({ open, onClose }: CreateGroupDialogProps) {
    const navigate = useNavigate();
    const { refreshGroups } = useSocial();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [touched, setTouched] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [pickedFile, setPickedFile] = useState<File | null>(null);
    const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // A fresh form every time it opens.
    useEffect(() => {
        if (!open) return;
        setName('');
        setDescription('');
        setTouched(false);
        setServerError(null);
        setAvatarBlob(null);
        setAvatarPreview(null);
    }, [open]);

    // The preview is an object URL: release it when replaced or closed.
    useEffect(() => () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); }, [avatarPreview]);

    // Same rules the server enforces (shared schema), shown as you type.
    const nameCheck = groupNameSchema.safeParse(name);
    const nameError = touched && !nameCheck.success ? nameCheck.error.issues[0]?.message : serverError;
    const descCheck = createGroupSchema.shape.description.safeParse(description);
    const descError = !descCheck.success ? descCheck.error.issues[0]?.message : undefined;
    const canSubmit = nameCheck.success && descCheck.success && !submitting;

    const handleCropped = (blob: Blob) => {
        setAvatarBlob(blob);
        setAvatarPreview(URL.createObjectURL(blob));
        setPickedFile(null);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (!canSubmit) return;
        setSubmitting(true);
        setServerError(null);
        try {
            const res = await api.createGroup(name.trim(), description.trim());
            const groupId = res.group._id;
            if (avatarBlob) {
                try {
                    const { url, publicId } = await uploadImage(avatarBlob, `groups/${groupId}`);
                    await api.updateGroupAvatar(groupId, url, publicId);
                } catch (err) {
                    toast.error(`Group created, but the photo didn't upload: ${(err as Error).message}`);
                }
            }
            await refreshGroups();
            onClose();
            navigate(`/groups/${groupId}`);
        } catch (err) {
            // 409 "already exists" and friends belong next to the name field.
            setServerError((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} title="New group" width={440} dismissible={!submitting}>
                <form className="cg-form" onSubmit={submit}>
                    <div className="cg-top">
                        <button type="button" className="avatar-editable" onClick={() => fileRef.current?.click()} aria-label="Choose a group photo">
                            <Avatar url={avatarPreview} name={name || 'group'} size="lg" />
                            <span className="avatar-edit-badge"><Icon name="camera" size={12} /></span>
                        </button>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = '';
                                if (file) setPickedFile(file);
                            }}
                        />
                        <div className="cg-top__hint">
                            {avatarPreview ? 'Photo added.' : 'Add a photo (optional). Without one, the group gets a generated glyph.'}
                        </div>
                    </div>

                    <Input
                        label="Group name"
                        placeholder="Group name"
                        value={name}
                        maxLength={40}
                        autoFocus
                        error={nameError}
                        onChange={(e) => {
                            setName(e.target.value);
                            setServerError(null);
                        }}
                        onBlur={() => setTouched(true)}
                    />
                    <Input
                        label="Description"
                        placeholder="What is this group about? (optional)"
                        value={description}
                        error={descError}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <div className="ui-dialog__actions">
                        <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={submitting} disabled={!canSubmit}>Create group</Button>
                    </div>
                </form>
            </Dialog>
            <AvatarCropModal file={pickedFile} saving={false} onCancel={() => setPickedFile(null)} onSave={handleCropped} />
        </>
    );
}

export default CreateGroupDialog;
