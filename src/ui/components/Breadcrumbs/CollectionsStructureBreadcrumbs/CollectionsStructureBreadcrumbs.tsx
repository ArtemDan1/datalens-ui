import React from 'react';

import {Breadcrumbs} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import {I18n} from 'i18n';

import {UserRole} from '../../../../shared/components/auth/constants/role';
import type {GetCollectionBreadcrumbsResponse} from '../../../../shared/schema';
import {DL} from '../../../constants/common';

import './CollectionsStructureBreadcrumbs.scss';

const i18n = I18n.keyset('component.collection-breadcrumbs');

const b = block('dl-breadcrumbs-collections-structure-breadcrumbs');

export type Props = {
    items: GetCollectionBreadcrumbsResponse;
    onChange: (collectionId: string | null) => void;
};

type BreadcrumbsItemData = {
    text: string;
    action: () => void;
};

export const CollectionsStructureBreadcrumbs: React.FC<Props> = ({items, onChange}) => {
    const isAdmin = (DL.USER?.roles || []).includes(UserRole.Admin);
    const preparedItems: BreadcrumbsItemData[] = [
        {
            text: isAdmin
                ? i18n('label_root-title')
                : i18n('label_root-title-dashboards'),
            action: () => {
                onChange(null);
            },
        },
    ];

    if (items.length > 0) {
        items.forEach((item) => {
            preparedItems.push({
                text: item.title,
                action: () => {
                    onChange(item.collectionId);
                },
            });
        });
    }

    return (
        <div className={b()}>
            <Breadcrumbs>
                {preparedItems.map((item, index) => {
                    return (
                        <Breadcrumbs.Item key={index} className={b('item')}>
                            <div onClick={item.action}>{item.text}</div>
                        </Breadcrumbs.Item>
                    );
                })}
            </Breadcrumbs>
        </div>
    );
};
