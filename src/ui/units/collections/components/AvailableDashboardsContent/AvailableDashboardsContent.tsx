import React from 'react';

import {Button, TextInput} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import {I18n} from 'i18n';
import {useDispatch} from 'react-redux';
import {EntryScope} from 'shared';
import type {GetEntriesEntryWithExcludedLocked} from 'shared/schema';
import {EntriesList} from 'ui/components/EntriesList/EntriesList';
import {PlaceholderIllustration} from 'ui/components/PlaceholderIllustration/PlaceholderIllustration';
import {SmartLoader} from 'ui/components/SmartLoader/SmartLoader';
import {ViewError} from 'ui/components/ViewError/ViewError';
import {getSdk} from 'ui/libs/schematic-sdk';
import {showToast} from 'ui/store/actions/toaster';

import type {AppDispatch} from '../../../../store';

import './AvailableDashboardsContent.scss';

const b = block('dl-available-dashboards');
const i18n = I18n.keyset('collections');
const filtersI18n = I18n.keyset('component.collection-filters');

const PAGE_SIZE = 100;
const SEARCH_DEBOUNCE_MS = 400;

export const AvailableDashboardsContent = () => {
    const dispatch: AppDispatch = useDispatch();

    const [search, setSearch] = React.useState('');
    const [query, setQuery] = React.useState('');
    const [entries, setEntries] = React.useState<GetEntriesEntryWithExcludedLocked[]>([]);
    const [page, setPage] = React.useState(0);
    const [hasNextPage, setHasNextPage] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<Error | null>(null);

    React.useEffect(() => {
        const handle = window.setTimeout(() => {
            setQuery(search.trim());
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(handle);
    }, [search]);

    React.useEffect(() => {
        setEntries([]);
        setPage(0);
        setHasNextPage(false);
        setError(null);
    }, [query]);

    const loadEntries = React.useCallback(
        async ({nextPage, append}: {nextPage: number; append: boolean}) => {
            setIsLoading(true);

            try {
                const response = await getSdk().sdk.us.getEntries({
                    scope: EntryScope.Dash,
                    page: nextPage,
                    pageSize: PAGE_SIZE,
                    excludeLocked: true,
                    orderBy: {
                        field: 'name',
                        direction: 'asc',
                    },
                    ...(query ? {filters: {name: query}} : {}),
                });

                setEntries((prev) =>
                    append
                        ? [...prev, ...(response.entries as GetEntriesEntryWithExcludedLocked[])]
                        : (response.entries as GetEntriesEntryWithExcludedLocked[]),
                );
                setPage(nextPage);
                setHasNextPage(response.hasNextPage);
                setError(null);
            } catch (err) {
                const errorValue = err as Error;

                if (append) {
                    dispatch(
                        showToast({
                            title: errorValue.message,
                            error: errorValue,
                        }),
                    );
                } else {
                    setError(errorValue);
                }
            } finally {
                setIsLoading(false);
            }
        },
        [dispatch, query],
    );

    React.useEffect(() => {
        loadEntries({nextPage: 0, append: false});
    }, [loadEntries]);

    const handleLoadMore = React.useCallback(() => {
        if (isLoading || !hasNextPage) {
            return;
        }

        loadEntries({nextPage: page + 1, append: true});
    }, [hasNextPage, isLoading, loadEntries, page]);

    const handleUpdateSearch = React.useCallback((value: string) => {
        setSearch(value);
    }, []);

    if (isLoading && entries.length === 0) {
        return <SmartLoader size="l" />;
    }

    if (error && entries.length === 0) {
        return <ViewError error={error} retry={() => loadEntries({nextPage: 0, append: false})} />;
    }

    const isSearchActive = Boolean(query);
    const placeholderName = isSearchActive ? 'notFound' : 'template';
    const placeholderTitle = isSearchActive ? i18n('label_not-found') : i18n('label_empty-list');

    return (
        <div className={b()}>
            <div className={b('search')}>
                <TextInput
                    value={search}
                    onUpdate={handleUpdateSearch}
                    placeholder={filtersI18n('label_filter-string-placeholder')}
                    hasClear
                    size="l"
                />
            </div>

            {entries.length === 0 ? (
                <PlaceholderIllustration name={placeholderName} title={placeholderTitle} />
            ) : (
                <div className={b('list')}>
                    <EntriesList entries={entries} />
                </div>
            )}

            {hasNextPage && (
                <div className={b('load-more')}>
                    <Button onClick={handleLoadMore} loading={isLoading}>
                        Load more
                    </Button>
                </div>
            )}
        </div>
    );
};
