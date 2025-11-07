import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Autocomplete, createFilterOptions, TextField, CircularProgress } from "@mui/material";

const CommonAutocomplete = ({
    name,
    label,
    required = false,
    value,
    onChange,
    options = [],
    allOptions = [],
    fetchOptions,
    error,
    helperText,
    multiple = false,
    disabled = false,
    allowAdd = false,
    onClearInput,
    disableMinChars = false,
    isSelect = false,
    sx,
    minChars = 1,
    externalFilter = false, // new prop: if true, use options as-is without internal filtering
    fetchOnMount = false,
    ...props
}) => {
    const filter = createFilterOptions();

    // Helper to get the option object by value from allOptions
    const getOptionByValue = (val) => {
        if (typeof val === 'object' && val && val.label && val.value !== undefined) {
            return val;
        }
        return allOptions.find(opt => opt.value === val) || { value: val, label: String(val) };
    };

    const [inputValue, setInputValue] = useState("");
    const [dynamicOptions, setDynamicOptions] = useState(options);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // Set inputValue to the label when value changes
    useEffect(() => {
        if (value && typeof value === 'object' && value.label) {
            setInputValue(value.label);
        } else {
            setInputValue("");
        }
    }, [value, isSelect]);

    // Always show selected values as objects with correct label
    const displayValue = multiple
        ? (value || []).map(getOptionByValue)
        : value ? getOptionByValue(value) : null;

    // Merge selected values into options so they always appear in the dropdown
    const mergedOptions = useMemo(() => {
        const currentOptions = fetchOptions ? dynamicOptions : options;
        if (!multiple) {
            // For single select, ensure the current value is in the options
            const optionMap = new Map(currentOptions.map(opt => [opt.value, opt]));
            const valObj = displayValue;
            if (valObj && !optionMap.has(valObj.value)) {
                optionMap.set(valObj.value, valObj);
            }
            return Array.from(optionMap.values());
        }
        // For multiple select, do not include selected values in the dropdown
        const selectedValues = new Set((value || []).map(v => getOptionByValue(v).value));
        const filteredOptions = currentOptions.filter(opt => !selectedValues.has(opt.value));
        return filteredOptions;
    }, [dynamicOptions, options, value, allOptions, multiple, fetchOptions]);

    // Debounce function
    const debounce = useCallback((func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
    }, []);

    // Fetch options when input changes
    const fetchOptionsDebounced = useMemo(
        () => debounce(async (val) => {
            if (fetchOptions) {
                setLoading(true);
                try {
                    const fetched = await fetchOptions(val);
                    setDynamicOptions(fetched);
                } catch (error) {
                    console.error('Error fetching options:', error);
                    setDynamicOptions([]);
                } finally {
                    setLoading(false);
                }
            } else {
                // If no fetchOptions, filter from provided options
                const filtered = options.filter(opt =>
                    opt.label.toLowerCase().includes(val.toLowerCase())
                );
                setDynamicOptions(filtered);
            }
        }, 300),
        [fetchOptions, options, debounce]
    );

    useEffect(() => {
       if (fetchOptions) {
           if (fetchOnMount) { // only fetch initially if explicitly allowed
               fetchOptionsDebounced("");
           }
       } else {
           setDynamicOptions(options);
       }
    }, [fetchOptions, options, fetchOptionsDebounced, fetchOnMount]);

    const handleChange = (e, newValue) => {
        if (multiple) {
            // return array of IDs
            onChange(newValue.map(opt => opt?.value ?? opt?.id ?? opt));
        } else {
            // return single ID (or null)
            onChange(newValue ? (newValue.value ?? newValue.id ?? newValue) : null);
        }

        // keep input text correct
        setInputValue(
            newValue?.label || newValue?.name || (typeof newValue === "string" ? newValue : "")
        );

        // Close the dropdown after selection
        setOpen(false);
    };


    const handleInputChange = (e, val, reason) => {
        setInputValue(val);
        fetchOptionsDebounced(val);
        if (props.onInputChange) {
            props.onInputChange(e, val, reason);
        }
    };

    const noOptionsText = props?.inputValue?.length < minChars
        ? `Type at least ${minChars} character${minChars > 1 ? 's' : ''} to search`
        : "No " + label + " found";

    const getLabelWithAsterisk = (label, required) => (
        <span>
            {label}
            {required && <span style={{ color: 'red' }}> *</span>}
        </span>
    );

    return (
        <Autocomplete
            sx={sx}
            multiple={multiple}
            options={mergedOptions}
            loading={loading}
            clearOnBlur={false}
            filterOptions={(options, params) => {
                const { inputValue } = params;
                if (externalFilter) {
                    // Use options as-is, no internal filtering
                    return options;
                }
                if (!disableMinChars && inputValue.length < minChars && inputValue.length > 0) {
                    // Show no options, so noOptionsText will appear
                    return [];
                }
                const filtered = filter(options, params);
                const isExisting = options.some((option) => inputValue === option.value);
                if (inputValue !== '' && !isExisting && allowAdd) {
                    filtered.push({
                        value: inputValue,
                        label: `Add "${inputValue}"`,
                    });
                }
                return filtered;
            }}
            getOptionLabel={
                (option) => {
                    // Value selected with enter, right from the input
                    if (typeof option === 'string') {
                        return option;
                    }
                    // Add "xxx" option created dynamically
                    if (option.inputValue && allowAdd) {
                        return option.inputValue;
                    }
                    // Regular option
                    return option.label;
                }
            }
            onClose={onClearInput && onClearInput}
            freeSolo={allowAdd && inputValue.length > 3}
            value={displayValue}
            onChange={handleChange}
            onInputChange={handleInputChange}
            inputValue={inputValue}
            isOptionEqualToValue={(option, val) => option.value === val.value}
            disabled={disabled}
            noOptionsText={noOptionsText}
            disableCloseOnSelect={multiple ? true : undefined}
            renderInput={params => (
                <TextField
                    {...params}
                    label={getLabelWithAsterisk(label, required)}
                    error={!!error}
                    helperText={helperText}
                    variant="standard"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
            {...props}
        />
    );
};

export default CommonAutocomplete; 