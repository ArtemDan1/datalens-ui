import type {History, Location} from 'history';
import {I18n} from 'i18n';
import type {
    BreadcrumbsItem,
    EntryBreadcrumbsProps,
} from 'ui/registry/units/common/types/components/EntryBreadcrumbs';
import {UserRole} from 'shared/components/auth/constants/role';
import {DL} from 'ui/constants/common';
import Utils from 'ui/utils';

const i18n = I18n.keyset('component.collection-breadcrumbs');

type GetEntityBreadcrumbsItems = (props: {
    entry: EntryBreadcrumbsProps['entry'];
    entityBreadcrumbs?: EntryBreadcrumbsProps['entityBreadcrumbs'];
    workbookName: EntryBreadcrumbsProps['workbookName'];
    history: History;
    location: Location;
}) => BreadcrumbsItem[];

export const getEntityBreadcrumbsItems: GetEntityBreadcrumbsItems = ({
    entry,
    entityBreadcrumbs,
    workbookName,
    history,
    location,
}) => {
    if (!entry) return [];

    const isAdmin = (DL.USER?.roles || []).includes(UserRole.Admin);
    const breadcrumbsItems: BreadcrumbsItem[] = [
        {
            text: isAdmin ? i18n('label_root-title') : i18n('label_root-title-dashboards'),
            action: () => {
                history.push('/collections');
            },
            path: '/collections',
        },
    ];

    if (entityBreadcrumbs && entityBreadcrumbs.length > 0) {
        entityBreadcrumbs.forEach((item: {title: string; collectionId: string}) => {
            breadcrumbsItems.push({
                text: item.title,
                action: () => {
                    history.push({
                        ...location,
                        pathname: `/collections/${item.collectionId}`,
                    });
                },
                path: `/collections/${item.collectionId}`,
            });
        });
    }

    if (workbookName) {
        breadcrumbsItems.push({
            text: workbookName,
            action: () => {
                history.push({
                    ...location,
                    pathname: `/workbooks/${entry.workbookId}`,
                });
            },
            path: `/workbooks/${entry.workbookId}`,
        });
    }

    let entryName = Utils.getEntryNameFromKey(entry?.key || '');
    entryName = (entry as {fake?: boolean}).fake ? '' : entryName;
    const fakeName = (entry as {fakeName?: string}).fakeName;

    if (entryName) {
        breadcrumbsItems.push({
            text: entryName,
            action: () => {},
        });
    } else if (fakeName) {
        breadcrumbsItems.push({
            text: fakeName,
            action: () => {},
        });
    }

    return breadcrumbsItems;
};
