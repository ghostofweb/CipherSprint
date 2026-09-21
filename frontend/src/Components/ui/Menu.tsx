import React from 'react';
import { Menu as MuiMenu, MenuItem } from '@mui/material';
import Icon, { IconName } from './Icon';
import { cx } from '../../Utils/cx';

export interface MenuAction {
    id: string;
    label: string;
    icon?: IconName;
    danger?: boolean;
    onSelect: () => void;
}

interface MenuProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    actions: MenuAction[];
}

function Menu({ anchorEl, open, onClose, actions }: MenuProps) {
    return (
        <MuiMenu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { className: 'ui-menu-paper' } }}
        >
            {actions.map((a) => (
                <MenuItem
                    key={a.id}
                    className={cx('ui-menu-item', a.danger && 'ui-menu-item--danger')}
                    onClick={() => {
                        onClose();
                        a.onSelect();
                    }}
                >
                    {a.icon && <Icon name={a.icon} size={16} />}
                    {a.label}
                </MenuItem>
            ))}
        </MuiMenu>
    );
}

export default Menu;
