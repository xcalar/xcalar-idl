// for the rendering of html file
module.exports = {
    menuBar: {
        'ws': 'Worksheet',
        'monitor': 'monitor',
        'ds': 'Data Stores',
        'schde': 'Scheduler',
        'exts': 'Extensions',
        'welcome': 'Welcome',
        'user': 'User',
        'signInAs': 'Signed in as',
        'Vikram': 'Vikram Joshi',
        'signOut': 'Sign out'
    },

    MenuTStr : {
       'Archive': 'Archive Table',
       'HideTbl': 'Hide Table',
       'UnHideTbl': 'Unhide Table',
       'DelTbl': 'Delete Table',
       'ExportTbl': 'Export Table',
       'Visual': 'Visualize in Tableau',
       'CPColNames': 'Copy Column Names',
       'DelAllDups': 'Delete All Duplicates',
       'QuickAgg': 'Quick Aggregates',
       'QuckAggaggFunc': 'Aggregate Functions',
       'QuickAggcorrFunc': 'Correlation Coefficient',
       'SmartCast': 'Smart Type Casting',
       'MVWS': 'Move to worksheet',
       'SortCols': 'Sort Columns',
       'SortAsc': 'A-Z',
       'SortDesc': 'Z-A',
       'Resize': 'Resize',
       'ResizeAllCols': 'Resize All Columns',
       'ResizeHeader': 'Size To Headers',
       'ResizeToContents': 'Size To Contents',
       'ResizeToAll': 'Size To Fit All',
       'AddCol': 'Add a column',
       'AddColLeft': 'On the left',
       'AddColRight': 'On the right',
       'DelCol': 'Delete column',
       'DelColPlura': 'Delete Columns',
       'DupCol': 'Duplicate column',
       'DelOtherDups': 'Delete other duplicates',
       'HideCol': 'Hide column',
       'HideColPlura': 'Hide Columns',
       'UnHideCol': 'Unhide column',
       'UnHideColPlura': 'Unhide Columns',
       'TxtAlign': 'Text align',
       'TxtAlignLeft': 'Left Align',
       'TxtAlignCenter': 'Center Align',
       'TxtAlignRight': 'Right Align',
       'TxtAlignWrap': 'Wrap Text',
       'RenameCol': 'Rename column',
       'RenameColTitle': 'New Column Name',
       'SplitCol': 'Split column',
       'SplitColDelim': 'Split Column By Delimiter',
       'SplitColNum': 'Number of Splits',
       'HP': 'Horizontal Partition',
       'HPNum': 'Number of partitions',
       'HPPlaceholder': 'Max value of 10',
       'ChangeType': 'Change data type',
       'Win': 'Window',
       'WinLag': 'Lag',
       'WinLead': 'Lead',
       'Format': 'Format',
       'Percent': 'Percent',
       'Round': 'Round',
       'RoundTitle': 'Num. of decimals to keep',
       'Sort': 'Sort',
       'Agg': 'Aggregate',
       'Flt': 'Filter',
       'FltCell': 'Filter this value',
       'ExclCell': 'Exclude this value',
       'GB': 'Group By',
       'Map': 'Map',
       'Join': 'Join',
       'Profile': 'Profile',
       'Exts': 'Extensions',
       'ExamCell': 'Examine',
       'PullAllCell': 'Pull all',
       'CPCell': 'Copy to clipboard'
    },

    WSTStr : {
        'SearchTableAndColumn': 'search for a table or column',
        'WSName': 'Worksheet Name',
        'WSHidden': 'worksheet is hidden',
        'InvalidWSName': 'Invalid worksheet name',
        'InvalidWSNameErr': 'please input a valid name!',
        'AddOrphanFail': 'Add Orphaned Table Failed',
        'AddWSFail': 'Cannot Create Worksheet',
        'AddWSFailMsg': 'There are too many worksheets in the panel',
        'DelWS': 'Delete Worksheet',
        'DelWSMsg': 'There are active tables in this worksheet. ' +
                    'How would you like to handle them?',

    },

    CommonTxtTstr : {
        'XcWelcome': 'Have fun with Xcalar Insight!',
        'Create': 'Create',
        'Continue': 'Continue',
        'Copy': 'Copy',
        'DefaultVal': 'Default Value',
        'HoldToDrag': 'click and hold to drag',
        'IntFloatOnly': 'Integer/Float Only',
        'NumCol': 'number of column',
        'Exit': 'Exit',
        'ClickToOpts': 'click to see options',
        'BackToOrig': 'Back to original',
        'Optional': 'Optional',
        'LogoutWarn': 'Please logout or you may lose unsaved work.',
        'SupportBundle': 'Support Bundle Generated',
        'SupportBundleInstr': 'Please check your backend for a .tar.gz file',
        'SupportBundleMsg': 'Support upload bundle id <id> successfully generated! ' +
                            'It is located on your Xcalar Server at <path>',
        'SuppoortBundleFail': 'Generation failed',
        'OpFail': 'Operation Failed'
    },

    TooltipTStr : {
        'ComingSoon': 'Coming Soon',
        'FocusColumn': 'Focused Column',
        'ChooseUdfModule': 'Please choose a module first',
        'ChooeseColToExport': 'Please Selected Columns you want to export',
        'NoJoin': 'Cannot join <type>',
        'SuggKey': 'Suggested Key',
        'NoWSToMV': 'no worksheet to move to',
        'NoExport': 'Cannot export column of type <type>',
        'Undo': 'Undo: <op>',
        'NoUndo': 'Last operation is "<op>", cannot undo',
        'NoUndoNoOp': 'No operation to undo',
        'Redo': 'Redo: <op>',
        'NoRedo': 'No operation to redo',
        'CloseQG': 'click to hide query graph',
        'OpenQG': 'click to view query graph',
        'Bookmark': 'click to add bookmark',
        'Bookmarked': 'bookmarked'
    }
};