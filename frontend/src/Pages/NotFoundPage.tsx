import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../Components/ui/Button';
import DecryptText from '../Components/DecryptText';

// Nothing lives here. The number decodes like everything else, then says so.
function NotFoundPage() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    return (
        <div className="nf">
            <DecryptText text="404" className="nf-code" duration={900} />
            <h1 className="nf-title">Nothing decodes at this address</h1>
            <p className="nf-body">
                <code>{pathname}</code> isn't a page on CipherSprint. The link may be old, or a letter slipped.
            </p>
            <div className="nf-actions">
                <Button variant="primary" onClick={() => navigate('/')}>Take a typing test</Button>
                <Button variant="ghost" onClick={() => navigate(-1)}>Go back</Button>
            </div>
        </div>
    );
}

export default NotFoundPage;
