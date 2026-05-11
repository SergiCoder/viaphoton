// Paste into https://dartpad.dev and press Run.
//
// The proper RRule helpers + a focused test suite. All tests must pass in
// any timezone (DST or otherwise). No "buggy reference version" — just the
// correct methods.

// ---------------------------------------------------------------------------
// Minimal stubs of the surrounding RRule infrastructure
// ---------------------------------------------------------------------------

enum RRuleFrequency { secondly, minutely, hourly, daily, weekly, monthly, yearly }

class RRule {
  DateTime? start;
  DateTime? until;
  RRuleFrequency frequency = RRuleFrequency.daily;
  Set<int> byWeekDay = {};
  Set<int> byHour = {};
  Set<int> byMinute = {};
  Set<int> bySecond = {};

  // Test stub: in the real codebase this is a recursive generator. Here we
  // let each test set the list it wants the validator to see.
  List<DateTime> mockTodayLocalTimes = const [];
  List<DateTime> generateTodayLocalTimes({DateTime? now}) => mockTodayLocalTimes;
}

extension DateTimeListAdjust on List<DateTime> {
  List<DateTime> adjustDatesInFrequency({
    required RRuleFrequency frequency,
    required List<DateTime> todayLocalTimes,
  }) =>
      todayLocalTimes.map((d) => d.adjustedDateInFrequency(frequency)).toList();
}

extension DateTimeAdjust on DateTime {
  /// Rounds [this] down to the precision implied by [frequency]
  /// (hourly → top-of-hour, minutely → top-of-minute, secondly → top-of-second).
  /// Used by the validator to bucket "currentTime" against scheduled fire times.
  DateTime adjustedDateInFrequency(RRuleFrequency frequency) {
    switch (frequency) {
      case RRuleFrequency.hourly:
        return copyWith(minute: 0, second: 0, millisecond: 0, microsecond: 0);
      case RRuleFrequency.minutely:
        return copyWith(second: 0, millisecond: 0, microsecond: 0);
      case RRuleFrequency.secondly:
        return copyWith(millisecond: 0, microsecond: 0);
      default:
        return this;
    }
  }
}

// ---------------------------------------------------------------------------
// The proper methods
// ---------------------------------------------------------------------------

extension RruleCurrentTimeValidation on RRule {
  /// Returns true if [currentTime] falls within an active occurrence of this
  /// rule.
  ///
  /// Strategy: cheap rejections first (start/until window, today's local-time
  /// window), then bucket [currentTime] into the rule's frequency precision
  /// and check it against today's scheduled fire times.
  ///
  /// Per RFC 5545, DTSTART and UNTIL are both *inclusive* — `currentTime ==
  /// start` or `currentTime == until` are valid occurrences.
  bool isValidCurrentTime(DateTime currentTime) {
    if (start != null && currentTime.isBefore(start!)) return false;
    if (until != null && currentTime.isAfter(until!)) return false;

    final todayLocalTimes = generateTodayLocalTimes(now: currentTime);
    if (todayLocalTimes.isEmpty) return false;
    if (todayLocalTimes.first.isAfter(currentTime)) return false;
    if (todayLocalTimes.last.isBefore(currentTime)) return false;

    final adjusted = todayLocalTimes.adjustDatesInFrequency(
      frequency: frequency,
      todayLocalTimes: todayLocalTimes,
    );
    return adjusted.contains(currentTime.adjustedDateInFrequency(frequency));
  }
}

extension DateTimeExtension on DateTime {
  /// Day of the year (1..366). Uses UTC anchors so DST transitions do not
  /// shorten the elapsed duration and truncate the day count.
  int get yearDay {
    final firstDayUtc = DateTime.utc(year, 1, 1);
    final thisDayUtc = DateTime.utc(year, month, day);
    return thisDayUtc.difference(firstDayUtc).inDays + 1;
  }

  /// Local midnight at the start of [this] day.
  DateTime get beginningOfDay => DateTime(year, month, day);

  /// Local midnight at the start of the day after [this]. Uses calendar
  /// arithmetic (`day + 1`) rather than `Duration(days: 1)` so the result
  /// stays at midnight across DST transitions (a fixed 24h Duration would
  /// land at 01:00 on spring-forward days and 23:00 on autumn-back days).
  DateTime get beginningOfNextDay => DateTime(year, month, day + 1);
}

// ---------------------------------------------------------------------------
// Tiny test harness
// ---------------------------------------------------------------------------

int _passed = 0;
int _failed = 0;

void expect(String name, bool ok, [String? detail]) {
  if (ok) {
    _passed++;
    print('  PASS  $name');
  } else {
    _failed++;
    print('  FAIL  $name${detail == null ? "" : "  ($detail)"}');
  }
}

void section(String title) => print('\n=== $title ===');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  section('isValidCurrentTime — bucketing inside the hour');
  {
    final rrule = RRule()
      ..frequency = RRuleFrequency.hourly
      ..mockTodayLocalTimes = [
        DateTime(2024, 6, 15, 9),
        DateTime(2024, 6, 15, 12),
        DateTime(2024, 6, 15, 15),
      ];
    expect(
      'within scheduled hour: 12:34:56 buckets to 12:00 → valid',
      rrule.isValidCurrentTime(DateTime(2024, 6, 15, 12, 34, 56)),
    );
    expect(
      'exactly on a fire moment: 12:00 → valid',
      rrule.isValidCurrentTime(DateTime(2024, 6, 15, 12)),
    );
    expect(
      'between buckets: 13:30 buckets to 13:00 → invalid',
      !rrule.isValidCurrentTime(DateTime(2024, 6, 15, 13, 30)),
    );
  }

  section('isValidCurrentTime — outside today\'s scheduled window');
  {
    final rrule = RRule()
      ..frequency = RRuleFrequency.hourly
      ..mockTodayLocalTimes = [DateTime(2024, 6, 15, 12)];
    expect(
      'before earliest fire today → invalid',
      !rrule.isValidCurrentTime(DateTime(2024, 6, 15, 9)),
    );
    expect(
      'after latest fire today → invalid',
      !rrule.isValidCurrentTime(DateTime(2024, 6, 15, 14)),
    );
    expect(
      'no fire times today → invalid',
      !(RRule()..mockTodayLocalTimes = []).isValidCurrentTime(DateTime.now()),
    );
  }

  section('isValidCurrentTime — start and until are inclusive (RFC 5545)');
  {
    final start = DateTime(2024, 1, 1, 10);
    final until = DateTime(2024, 12, 31, 23);

    final atStart = RRule()
      ..start = start
      ..until = until
      ..frequency = RRuleFrequency.hourly
      ..mockTodayLocalTimes = [start];
    expect('currentTime == start → valid (DTSTART inclusive)',
        atStart.isValidCurrentTime(start));

    final atUntil = RRule()
      ..start = start
      ..until = until
      ..frequency = RRuleFrequency.hourly
      ..mockTodayLocalTimes = [until];
    expect('currentTime == until → valid (UNTIL inclusive)',
        atUntil.isValidCurrentTime(until));

    final beforeStart = DateTime(2023, 12, 31, 23);
    expect(
      'currentTime before start → invalid',
      !(RRule()
            ..start = start
            ..frequency = RRuleFrequency.hourly
            ..mockTodayLocalTimes = [beforeStart])
          .isValidCurrentTime(beforeStart),
    );

    final afterUntil = DateTime(2025, 1, 1);
    expect(
      'currentTime after until → invalid',
      !(RRule()
            ..until = until
            ..frequency = RRuleFrequency.hourly
            ..mockTodayLocalTimes = [afterUntil])
          .isValidCurrentTime(afterUntil),
    );
  }

  section('isValidCurrentTime — daily+byWeekDay respects time-of-day');
  {
    // Rule: every Monday at 12:00 only.
    final monday12 = DateTime(2024, 6, 17, 12); // Mon 17 Jun 2024
    final monday14 = DateTime(2024, 6, 17, 14);
    final rrule = RRule()
      ..frequency = RRuleFrequency.daily
      ..byWeekDay = {DateTime.monday}
      ..byHour = {12}
      ..mockTodayLocalTimes = [monday12];
    expect(
      'Monday at 12:00 → valid',
      rrule.isValidCurrentTime(monday12),
    );
    expect(
      'Monday at 14:00 (BYHOUR=12 only) → invalid',
      !rrule.isValidCurrentTime(monday14),
    );
  }

  section('yearDay — DST-safe day-of-year');
  expect('Jan 1 2024 → 1', DateTime(2024, 1, 1).yearDay == 1);
  expect('Mar 1 2024 (post-leap-day) → 61', DateTime(2024, 3, 1).yearDay == 61);
  expect('Jun 15 2024 (leap year) → 167',
      DateTime(2024, 6, 15).yearDay == 167);
  expect('Dec 31 2023 (non-leap) → 365',
      DateTime(2023, 12, 31).yearDay == 365);
  expect('Dec 31 2024 (leap) → 366',
      DateTime(2024, 12, 31).yearDay == 366);

  section('beginningOfDay / beginningOfNextDay — DST-safe boundaries');
  expect('beginningOfDay strips the time component',
      DateTime(2024, 6, 15, 14, 30).beginningOfDay == DateTime(2024, 6, 15));
  // March 31 2024 = DST spring-forward day in most European timezones.
  // Duration(days: 1) would land at 01:00; calendar arithmetic stays at 00:00.
  expect('beginningOfNextDay stays at midnight across spring-forward DST',
      DateTime(2024, 3, 31).beginningOfNextDay.hour == 0);
  expect('beginningOfNextDay rolls month',
      DateTime(2024, 1, 31).beginningOfNextDay == DateTime(2024, 2, 1));
  expect('beginningOfNextDay rolls year',
      DateTime(2024, 12, 31).beginningOfNextDay == DateTime(2025, 1, 1));
  expect('beginningOfNextDay handles leap day',
      DateTime(2024, 2, 29).beginningOfNextDay == DateTime(2024, 3, 1));

  print('\n=== Summary ===');
  print('$_passed passed, $_failed failed');
  if (_failed != 0) {
    print('Any failure here means the proper methods are no longer correct.');
  }
}
