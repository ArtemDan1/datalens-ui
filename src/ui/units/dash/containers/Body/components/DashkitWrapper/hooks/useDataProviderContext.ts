import React from 'react';

import {useSelector} from 'react-redux';
import {DASH_INFO_HEADER, DL_CONTEXT_HEADER} from 'shared';
import {getSdk} from 'ui/libs/schematic-sdk';

import {selectCurrentTabId, selectEntryId} from '../../../../../store/selectors/dashTypedSelectors';

export const useDataProviderContext = (): {
    dataProviderContextGetter: () => Record<string, string>;
} => {
    const entryId = useSelector(selectEntryId);
    const tabId = useSelector(selectCurrentTabId);

    React.useEffect(() => {
        const dashInfo = new URLSearchParams({
            dashId: entryId || '',
            dashTabId: tabId || '',
        }).toString();

        const dlContext = JSON.stringify({
            dashId: entryId || '',
            dashTabId: tabId || '',
        });

        getSdk().sdk.setDefaultHeader({
            name: DASH_INFO_HEADER,
            value: dashInfo,
        });
        getSdk().sdk.setDefaultHeader({
            name: DL_CONTEXT_HEADER,
            value: dlContext,
        });

        return () => {
            getSdk().sdk.setDefaultHeader({
                name: DASH_INFO_HEADER,
                value: '',
            });
            getSdk().sdk.setDefaultHeader({
                name: DL_CONTEXT_HEADER,
                value: '',
            });
        };
    }, [entryId, tabId]);

    const dataProviderContextGetter = React.useCallback(() => {
        const dashInfo = {
            dashId: entryId || '',
            dashTabId: tabId || '',
        };

        return {
            [DASH_INFO_HEADER]: new URLSearchParams(dashInfo).toString(),
            [DL_CONTEXT_HEADER]: JSON.stringify(dashInfo),
        };
    }, [entryId, tabId]);

    return {dataProviderContextGetter};
};
