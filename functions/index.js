const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

// The `createPersonnel` Cloud Function has been removed.
const MANILA_TZ = "Asia/Manila";
const MANILA_OFFSET_MINUTES = 8 * 60;

const pad2 = (value) => String(value).padStart(2, "0");

const parseDateKey = (dateKey) => {
  if (typeof dateKey !== "string") return null;
  const match = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  return { year, month, day };
};

const toDateKey = (date) => {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const getManilaDateKey = (date = new Date()) => {
  const shifted = new Date(date.getTime() + (MANILA_OFFSET_MINUTES * 60 * 1000));
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
};

const getPreviousDateKey = (dateKey) => {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return null;
  const utcMidnight = Date.UTC(parsed.year, parsed.month - 1, parsed.day, 0, 0, 0, 0);
  const prev = new Date(utcMidnight - (24 * 60 * 60 * 1000));
  return `${prev.getUTCFullYear()}-${pad2(prev.getUTCMonth() + 1)}-${pad2(prev.getUTCDate())}`;
};

const buildLocalDateTime = (dateKey, hours, minutes) => {
  const parts = parseDateKey(dateKey);
  if (!parts) return null;
  return new Date(parts.year, parts.month - 1, parts.day, hours, minutes, 0, 0);
};

const buildManilaDateTime = (dateKey, hours, minutes) => {
  const parts = parseDateKey(dateKey);
  if (!parts) return null;
  const utcMs = Date.UTC(parts.year, parts.month - 1, parts.day, hours, minutes, 0, 0) - (MANILA_OFFSET_MINUTES * 60 * 1000);
  return new Date(utcMs);
};

const formatTime = (date) => {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: MANILA_TZ });
};

const parseOffsetTime = (value) => {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return (hour * 60) + minute;
};

const formatMinutesLabel = (minutes) => {
  if (!Number.isInteger(minutes) || minutes < 0) return "";
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const hour12 = ((hour + 11) % 12) + 1;
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour12}:${pad2(minute)} ${period}`;
};

const formatOffsetHoursLabel = (hours) => {
  if (!Number.isFinite(hours) || hours <= 0) return "";
  const amount = Number.isInteger(hours) ? String(hours) : String(Number(hours.toFixed(1)));
  return `${amount}h`;
};

const formatDateLabel = (dateKey) => {
  const date = buildManilaDateTime(dateKey, 0, 0);
  if (!date) return dateKey;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: MANILA_TZ,
  }).format(date);
};

const buildOffsetRemarkLine = ({ dateKey, hours, startTime, endTime }) => {
  const dateLabel = formatDateLabel(dateKey);
  const startLabel = formatMinutesLabel(parseOffsetTime(startTime));
  const endLabel = formatMinutesLabel(parseOffsetTime(endTime));
  const hoursLabel = formatOffsetHoursLabel(hours);

  if (startLabel && endLabel) {
    return `${dateLabel} - Offset used from ${startLabel}-${endLabel}${hoursLabel ? ` (${hoursLabel})` : ""}.`;
  }
  if (hoursLabel) {
    return `${dateLabel} - Offset used (${hoursLabel}).`;
  }
  return `${dateLabel} - Offset used.`;
};

const appendRemarkLine = (remarks, line) => {
  const current = typeof remarks === "string" ? remarks.trim() : "";
  if (!current) return line;

  const lines = current.split("\n").map((item) => item.trim()).filter(Boolean);
  if (lines.includes(line)) return current;
  return `${current}\n${line}`;
};

const includesBoundary = (startMinutes, endMinutes, boundaryMinutes) => (
  Number.isInteger(startMinutes)
  && Number.isInteger(endMinutes)
  && Number.isInteger(boundaryMinutes)
  && startMinutes <= boundaryMinutes
  && boundaryMinutes <= endMinutes
);

const hasEventTime = (doc, key) => Boolean(doc && doc[key] && doc[key].time);

const isMissingIndexError = (error) => {
  const code = typeof error?.code === "number" ? error.code : null;
  const message = String(error?.message || "").toLowerCase();
  return code === 9 || message.includes("index");
};

const fetchOffsetRequestsForDate = async (dateKey) => {
  const baseQuery = db.collectionGroup("offsetRequests").where("date", "==", dateKey);

  try {
    return await baseQuery
      .where("status", "==", "approved")
      .where("mode", "==", "use")
      .get();
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }
    console.warn("[autoplotApprovedOffsetUseCheckpoints] Missing index for filtered query; falling back to date-only scan.");
    return baseQuery.get();
  }
};

const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const listWeekdayDateKeys = (fromKey, toKey) => {
  const from = buildLocalDateTime(fromKey, 0, 0);
  const to = buildLocalDateTime(toKey, 0, 0);
  if (!from || !to) return [];
  if (from > to) return [];

  const keys = [];
  const cursor = new Date(from.getTime());
  while (cursor <= to) {
    if (!isWeekend(cursor)) {
      keys.push(toDateKey(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
};

const shouldAutoplotTimesheet = (docData) => {
  if (!docData) return true;
  const hasAnyTime =
    Boolean(docData.timeIn && docData.timeIn.time) ||
    Boolean(docData.lunchStart && docData.lunchStart.time) ||
    Boolean(docData.lunchEnd && docData.lunchEnd.time) ||
    Boolean(docData.timeOut && docData.timeOut.time);

  if (!hasAnyTime) return true;

  const normalizedStatus = String(docData.status || "").trim().toLowerCase();
  if (normalizedStatus === "on leave" || normalizedStatus === "leave") return true;
  return false;
};

exports.autoplotApprovedLeaveToTimesheet = functions.firestore
  .document("personnel/{personnelId}/leaveRequests/{requestId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};

    if ((before.status || "pending") === (after.status || "pending")) return null;
    if (String(after.status || "").toLowerCase() !== "approved") return null;
    if (String(after.type || "leave").toLowerCase() !== "leave") return null;

    const personnelId = context.params.personnelId;
    if (!personnelId) return null;

    const fromDateKey = String(after.fromDate || after.date || "").trim();
    const toDateKeyValue = String(after.toDate || after.date || "").trim();
    const dateKeys = listWeekdayDateKeys(fromDateKey, toDateKeyValue);
    if (!dateKeys.length) return null;

    const ownerRef = db.collection("personnel").doc(personnelId);

    const createdAt = admin.firestore.FieldValue.serverTimestamp();
    const updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.runTransaction(async (tx) => {
      const ownerSnap = await tx.get(ownerRef);
      if (!ownerSnap.exists) return;

      for (const dateKey of dateKeys) {
        const timesheetRef = ownerRef.collection("timesheets").doc(dateKey);
        const timesheetSnap = await tx.get(timesheetRef);
        const existing = timesheetSnap.exists ? timesheetSnap.data() : null;
        if (existing && !shouldAutoplotTimesheet(existing)) continue;

        const timeInAt = buildLocalDateTime(dateKey, 9, 0);
        const lunchStartAt = buildLocalDateTime(dateKey, 12, 0);
        const lunchEndAt = buildLocalDateTime(dateKey, 13, 0);
        const timeOutAt = buildLocalDateTime(dateKey, 17, 0);

        if (!timeInAt || !lunchStartAt || !lunchEndAt || !timeOutAt) continue;

        tx.set(
          timesheetRef,
          {
            dateKey,
            timeIn: { time: formatTime(timeInAt), at: admin.firestore.Timestamp.fromDate(timeInAt) },
            lunchStart: { time: formatTime(lunchStartAt), at: admin.firestore.Timestamp.fromDate(lunchStartAt) },
            lunchEnd: { time: formatTime(lunchEndAt), at: admin.firestore.Timestamp.fromDate(lunchEndAt) },
            timeOut: { time: formatTime(timeOutAt), at: admin.firestore.Timestamp.fromDate(timeOutAt) },
            totalHours: "7h 0m",
            status: "On Leave",
            remarks: "Approved Leave",
            notes: "Approved Leave",
            updatedAt,
            createdAt: existing?.createdAt || createdAt,
          },
          { merge: true }
        );
      }
    });

    return null;
  });

exports.autoplotApprovedOffsetUseCheckpoints = functions.pubsub
  .schedule("every 1 minutes")
  .timeZone(MANILA_TZ)
  .onRun(async () => {
    const now = new Date();
    const todayKey = getManilaDateKey(now);
    const previousKey = getPreviousDateKey(todayKey);
    const targetDateKeys = [todayKey, previousKey].filter(Boolean);

    for (const dateKey of targetDateKeys) {
      const requestSnapshot = await fetchOffsetRequestsForDate(dateKey);

      for (const requestDoc of requestSnapshot.docs) {
        const requestData = requestDoc.data() || {};
        if (String(requestData.status || "").toLowerCase() !== "approved") continue;
        if (String(requestData.mode || "").toLowerCase() !== "use") continue;

        const ownerRef = requestDoc.ref.parent.parent;
        if (!ownerRef) continue;

        const requestHoursRaw = typeof requestData.hours === "number" ? requestData.hours : Number(requestData.hours);
        const requestHours = Number.isFinite(requestHoursRaw) ? requestHoursRaw : 0;
        const startMinutes = parseOffsetTime(requestData.startTime);
        const endMinutes = parseOffsetTime(requestData.endTime);
        if (startMinutes === null || endMinutes === null || startMinutes > endMinutes) continue;

        const includeNineAm = includesBoundary(startMinutes, endMinutes, 9 * 60);
        const includeTwelvePm = includesBoundary(startMinutes, endMinutes, 12 * 60);
        const includeFivePm = includesBoundary(startMinutes, endMinutes, 17 * 60);
        const remarkLine = buildOffsetRemarkLine({
          dateKey,
          hours: requestHours,
          startTime: requestData.startTime,
          endTime: requestData.endTime,
        });

        const timesheetRef = ownerRef.collection("timesheets").doc(dateKey);
        await db.runTransaction(async (tx) => {
          const timesheetSnap = await tx.get(timesheetRef);
          const existing = timesheetSnap.exists ? (timesheetSnap.data() || {}) : {};
          const updates = {
            dateKey,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };
          let shouldWriteTimesheet = false;
          let latestAppliedStatus = null;
          let latestAppliedTime = null;

          if (!existing.createdAt) {
            updates.createdAt = admin.firestore.FieldValue.serverTimestamp();
            shouldWriteTimesheet = true;
          }

          const tryApplyCheckpoint = ({ eventKey, hour, minute, status }) => {
            const checkpointAt = buildManilaDateTime(dateKey, hour, minute);
            if (!checkpointAt) return;
            if (now.getTime() < checkpointAt.getTime()) return;
            if (hasEventTime(existing, eventKey) || hasEventTime(updates, eventKey)) return;

            const timeLabel = formatTime(checkpointAt);
            updates[eventKey] = {
              time: timeLabel,
              at: admin.firestore.Timestamp.fromDate(checkpointAt),
              ip: "AUTO OFFSET",
              location: "AUTO OFFSET",
            };
            shouldWriteTimesheet = true;
            latestAppliedStatus = status;
            latestAppliedTime = timeLabel;
          };

          if (includeNineAm) {
            tryApplyCheckpoint({ eventKey: "timeIn", hour: 9, minute: 0, status: "timed-in" });
          }
          const hasTimeIn = hasEventTime(existing, "timeIn") || hasEventTime(updates, "timeIn");
          if (includeTwelvePm && hasTimeIn) {
            tryApplyCheckpoint({ eventKey: "lunchStart", hour: 12, minute: 0, status: "on-lunch" });
            tryApplyCheckpoint({ eventKey: "lunchEnd", hour: 13, minute: 0, status: "timed-in" });
          }
          if (includeFivePm && hasTimeIn) {
            tryApplyCheckpoint({ eventKey: "timeOut", hour: 17, minute: 0, status: "timed-out" });
          }

          const currentRemarks = typeof existing.remarks === "string" ? existing.remarks : "";
          const remarksAlreadyHasLine = currentRemarks
            .split("\n")
            .map((item) => item.trim())
            .includes(remarkLine);
          const existingRequestIds = Array.isArray(existing.offsetRemarkRequestIds)
            ? existing.offsetRemarkRequestIds.filter((item) => typeof item === "string")
            : [];
          const requestAlreadyLinked = existingRequestIds.includes(requestDoc.id);

          if (!remarksAlreadyHasLine || !requestAlreadyLinked) {
            updates.remarks = appendRemarkLine(currentRemarks, remarkLine);
            updates.offsetRemarkRequestIds = admin.firestore.FieldValue.arrayUnion(requestDoc.id);
            shouldWriteTimesheet = true;
          }

          if (shouldWriteTimesheet) {
            tx.set(timesheetRef, updates, { merge: true });
          }

          if (latestAppliedStatus && latestAppliedTime && dateKey === todayKey) {
            tx.set(ownerRef, {
              activityStatus: {
                status: latestAppliedStatus,
                time: latestAppliedTime,
                dateKey,
              },
              activityStatusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
          }
        });
      }
    }

    return null;
  });
