import { useCallback, useMemo, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Popover,
  TextField,
} from "@mui/material";
import dayjs from "dayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ClearIcon from "@mui/icons-material/Clear";

/**
 * Date range using one dropdown calendar (free MUI X package).
 * @param {{ from?: Date, to?: Date } | undefined} value
 * @param {(next: { from?: Date, to?: Date } | undefined) => void} onChange
 */
const CommonDateRangeSelect = ({
  label,
  value,
  onChange,
  size = "small",
  minWidth = 260,
  sx,
  clearable = true,
  emptyLabel = "Select date range",
  ...calendarProps
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const fromDayjs = useMemo(
    () => (value?.from ? dayjs(value.from) : null),
    [value?.from]
  );
  const toDayjs = useMemo(
    () => (value?.to ? dayjs(value.to) : null),
    [value?.to]
  );

  const emit = useCallback(
    (next) => {
      if (!next?.from && !next?.to) {
        onChange?.(undefined);
        return;
      }
      onChange?.(next);
    },
    [onChange]
  );

  const open = Boolean(anchorEl);
  const displayValue = useMemo(() => {
    if (!value?.from && !value?.to) return emptyLabel;
    if (value?.from && !value?.to) return dayjs(value.from).format("MMM D, YYYY");
    if (!value?.from && value?.to) return dayjs(value.to).format("MMM D, YYYY");
    return `${dayjs(value.from).format("MMM D")} - ${dayjs(value.to).format("MMM D, YYYY")}`;
  }, [value, emptyLabel]);

  const isSameDay = (a, b) =>
    Boolean(a && b && dayjs(a).isSame(dayjs(b), "day"));

  const handleCalendarChange = useCallback(
    (selectedDay) => {
      if (!selectedDay) return;
      const picked = selectedDay.startOf("day");
      const from = value?.from ? dayjs(value.from).startOf("day") : null;
      const to = value?.to ? dayjs(value.to).startOf("day") : null;

      if (!from || (from && to)) {
        emit({ from: picked.toDate() });
        return;
      }

      if (picked.isBefore(from, "day")) {
        emit({ from: picked.toDate(), to: from.toDate() });
      } else {
        emit({ from: from.toDate(), to: picked.toDate() });
      }
      setAnchorEl(null);
    },
    [value, emit]
  );

  const RangeDay = useCallback(
    (props) => {
      const { day, outsideCurrentMonth, ...other } = props;
      const isStart = isSameDay(day, fromDayjs);
      const isEnd = isSameDay(day, toDayjs);
      const inRange =
        fromDayjs &&
        toDayjs &&
        day.isAfter(fromDayjs, "day") &&
        day.isBefore(toDayjs, "day");

      return (
        <PickersDay
          {...other}
          day={day}
          outsideCurrentMonth={outsideCurrentMonth}
          selected={isStart || isEnd}
          sx={{
            ...(inRange && {
              backgroundColor: "action.selected",
              borderRadius: 0,
              "&:hover, &:focus": { backgroundColor: "action.selected" },
            }),
            ...(isStart && {
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }),
            ...(isEnd && {
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }),
            ...(isStart && isEnd && {
              borderRadius: "50%",
            }),
          }}
        />
      );
    },
    [fromDayjs, toDayjs]
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        minWidth,
        ...sx,
      }}
    >
      <TextField
        label={label}
        value={displayValue}
        size={size}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        inputProps={{ readOnly: true }}
        sx={{ width: "100%" }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {clearable && (value?.from || value?.to) ? (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    emit(undefined);
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              ) : null}
              <CalendarTodayIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            bgcolor: "#fff",
            color: "text.primary",
            border: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <Box
          sx={{
            p: 1,
            bgcolor: "#fff",
            "& .MuiDayCalendar-root, & .MuiPickersCalendarHeader-root": {
              color: "text.primary",
            },
            "& .MuiPickersArrowSwitcher-root .MuiIconButton-root": {
              color: "text.primary",
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "#fff",
            },
            "& .MuiPickersArrowSwitcher-root .MuiIconButton-root:hover": {
              bgcolor: "action.hover",
            },
            "& .MuiPickersArrowSwitcher-root .MuiSvgIcon-root": {
              color: "text.primary",
            },
            "& .MuiPickersCalendarHeader-switchViewButton": {
              color: "text.primary",
            },
            "& .MuiPickersDay-root": {
              color: "text.primary",
            },
          }}
        >
          <DateCalendar
            value={toDayjs ?? fromDayjs ?? null}
            onChange={handleCalendarChange}
            slots={{ day: RangeDay }}
            {...calendarProps}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", px: 1, pb: 0.5 }}>
            <Button
              size="small"
              onClick={() => {
                emit(undefined);
                setAnchorEl(null);
              }}
            >
              Clear
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export default CommonDateRangeSelect;
