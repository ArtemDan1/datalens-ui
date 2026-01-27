import React from 'react';

import {Checkbox, Dialog, Loader, TextInput} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import {I18n} from 'i18n';

import {EntryDialogResolveStatus} from '../EntryDialogues/constants';
import {UserRole} from '../../../shared/components/auth/constants/role';
import type {ListUser} from '../../../shared/schema/auth/types/users';
import type {AccessRightsProps} from '../../registry/units/common/types/components/AccessRights';

import './AccessRights.scss';

const b = block('dl-access-rights');
const i18n = I18n.keyset('component.iam-access-dialog');

const getUserTitle = (user: ListUser) => {
    const nameParts = [user.firstName, user.lastName].filter(Boolean);
    if (nameParts.length > 0) {
        return nameParts.join(' ');
    }

    return user.login || user.email || user.userId;
};

const loadSdk = async () => {
    const {getSdk} = await import('ui/libs/schematic-sdk');
    return getSdk().sdk;
};

const fetchAllUsers = async () => {
    const pageSize = 100;
    let page = 0;
    const users: ListUser[] = [];
    const sdk = await loadSdk();

    while (true) {
        const response = await sdk.auth.getUsersList({page, pageSize});
        users.push(...(response.users || []));

        if (!response.users?.length || response.users.length < pageSize) {
            break;
        }

        page += 1;
    }

    return users;
};

export const AccessRights: React.FC<AccessRightsProps> = ({entry, visible, onClose}) => {
    const [users, setUsers] = React.useState<ListUser[]>([]);
    const [selectedUserIds, setSelectedUserIds] = React.useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [error, setError] = React.useState<Error | null>(null);
    const [search, setSearch] = React.useState('');

    const isAdmin = React.useMemo(() => {
        const dl = window?.DL as
            | {isAuthEnabled?: boolean; user?: {roles?: string[]}}
            | undefined;
        if (!dl?.isAuthEnabled) {
            return true;
        }
        return Boolean(dl.user?.roles?.includes(UserRole.Admin));
    }, []);

    const loadAccess = React.useCallback(async () => {
        if (!visible) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const [usersResponse, accessResponse] = await Promise.all([
                fetchAllUsers(),
                loadSdk().then((sdk) => sdk.us.getEntryAccess({entryId: entry.entryId})),
            ]);

            const filteredUsers = usersResponse.filter(
                (user) => !user.roles?.includes(UserRole.Admin),
            );
            const usersById = new Map(
                filteredUsers.map((user) => [String(user.userId), user]),
            );

            setUsers(filteredUsers);
            const filteredAccess = new Set(
                accessResponse.userIds
                    .map((id) => String(id))
                    .filter((id) => usersById.has(id)),
            );
            setSelectedUserIds(filteredAccess);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [entry.entryId, visible]);

    React.useEffect(() => {
        void loadAccess();
    }, [loadAccess]);

    const toggleUser = React.useCallback((userId: string, checked: boolean) => {
        setSelectedUserIds((prev) => {
            const next = new Set(prev);
            if (checked) {
                next.add(String(userId));
            } else {
                next.delete(String(userId));
            }
            return next;
        });
    }, []);

    const handleSave = React.useCallback(async () => {
        setIsSaving(true);
        setError(null);

        try {
            const sdk = await loadSdk();
            await sdk.us.updateEntryAccess({
                entryId: entry.entryId,
                userIds: Array.from(selectedUserIds).map((id) => String(id)),
            });
            onClose({status: EntryDialogResolveStatus.Success});
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsSaving(false);
        }
    }, [entry.entryId, onClose, selectedUserIds]);

    const handleClose = React.useCallback(() => {
        onClose({status: EntryDialogResolveStatus.Close});
    }, [onClose]);

    const handleDialogClose = React.useCallback(() => {
        handleClose();
    }, [handleClose]);

    const filteredUsers = React.useMemo(() => {
        const normalizedQuery = search.trim().toLowerCase();
        if (!normalizedQuery) {
            return users;
        }

        return users.filter((user) => {
            const title = getUserTitle(user);
            const haystack = [title, user.login, user.email]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(normalizedQuery);
        });
    }, [search, users]);

    const content = () => {
        if (!isAdmin) {
            return <div className={b('error')}>{i18n('label_access_error')}</div>;
        }

        if (isLoading) {
            return (
                <div className={b('loader')}>
                    <Loader size="m" />
                </div>
            );
        }

        if (error) {
            return <div className={b('error')}>{error.message}</div>;
        }

        if (users.length === 0) {
            return <div className={b('empty')}>{i18n('label_no-data')}</div>;
        }

        return (
            <div>
                <div className={b('search')}>
                    <TextInput
                        value={search}
                        onUpdate={setSearch}
                        placeholder={i18n('placeholder_search')}
                        size="m"
                    />
                </div>
                <div className={b('list')}>
                    {filteredUsers.map((user) => {
                        const isChecked = selectedUserIds.has(String(user.userId));

                        return (
                            <div key={user.userId} className={b('row')}>
                            <div className={b('user')}>{getUserTitle(user)}</div>
                            <Checkbox
                                checked={isChecked}
                                onUpdate={(checked) => toggleUser(String(user.userId), checked)}
                            />
                        </div>
                    );
                    })}
                </div>
                {filteredUsers.length === 0 && (
                    <div className={b('empty')}>{i18n('label_no-data')}</div>
                )}
            </div>
        );
    };

    return (
        <Dialog open={visible} onClose={handleDialogClose} size="m">
            <Dialog.Header caption={i18n('title_access-list')} />
            <Dialog.Body className={b()}>{content()}</Dialog.Body>
            <Dialog.Footer
                textButtonCancel={i18n('action_cancel')}
                onClickButtonCancel={handleClose}
                propsButtonCancel={{disabled: isSaving}}
                textButtonApply={i18n('action_save')}
                onClickButtonApply={handleSave}
                propsButtonApply={{disabled: !isAdmin || isSaving, loading: isSaving}}
            />
        </Dialog>
    );
};
