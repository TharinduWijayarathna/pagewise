import SwiftUI
import WidgetKit

// MARK: - Data written by the app (src/widgets/snapshot.ts → ExtensionStorage "snapshot")

private let appGroup = "group.com.pagewise.app"

struct Snapshot: Decodable {
  struct Item: Decodable {
    let label: String
    let docTitle: String
    let docId: String
    let date: String // YYYY-MM-DD
  }
  let items: [Item]
  let cardDues: [Double] // epoch ms
  let studyDocId: String?
  let docCount: Int

  static func load() -> Snapshot? {
    guard let json = UserDefaults(suiteName: appGroup)?.string(forKey: "snapshot"),
          let data = json.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(Snapshot.self, from: data)
  }
}

struct Row: Identifiable {
  let id: String
  let label: String
  let docTitle: String
  let docId: String
  let days: Int

  var when: String {
    switch days {
    case 0: return "Today"
    case 1: return "Tomorrow"
    case 2...13: return "In \(days) days"
    default:
      let f = DateFormatter()
      f.setLocalizedDateFormatFromTemplate("MMM d")
      return f.string(from: Calendar.current.date(byAdding: .day, value: days, to: Calendar.current.startOfDay(for: Date()))!)
    }
  }
  var soon: Bool { days <= 3 }
}

struct ComingUpEntry: TimelineEntry {
  let date: Date
  let rows: [Row]
  let cardsDue: Int
  let studyDocId: String?
  let hasDocs: Bool

  static let placeholder = ComingUpEntry(
    date: Date(),
    rows: [
      Row(id: "1", label: "Rent due", docTitle: "Apartment lease", docId: "", days: 2),
      Row(id: "2", label: "Insurance renews", docTitle: "Car policy", docId: "", days: 9),
    ],
    cardsDue: 12, studyDocId: nil, hasDocs: true)

  /// Recomputes "days left" for `date`, so entries made in advance stay correct after midnight.
  static func at(_ date: Date, from s: Snapshot?) -> ComingUpEntry {
    guard let s else { return ComingUpEntry(date: date, rows: [], cardsDue: 0, studyDocId: nil, hasDocs: false) }
    let cal = Calendar.current
    let today = cal.startOfDay(for: date)
    let fmt = DateFormatter()
    fmt.calendar = cal
    fmt.timeZone = .current
    fmt.dateFormat = "yyyy-MM-dd"
    let rows: [Row] = s.items.compactMap { item in
      guard let d = fmt.date(from: item.date),
            let days = cal.dateComponents([.day], from: today, to: cal.startOfDay(for: d)).day,
            days >= 0 else { return nil }
      return Row(id: item.docId + item.date + item.label, label: item.label, docTitle: item.docTitle, docId: item.docId, days: days)
    }
    let nowMs = date.timeIntervalSince1970 * 1000
    return ComingUpEntry(
      date: date, rows: rows, cardsDue: s.cardDues.filter { $0 <= nowMs }.count,
      studyDocId: s.studyDocId, hasDocs: s.docCount > 0)
  }
}

// MARK: - Timeline

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> ComingUpEntry { .placeholder }

  func getSnapshot(in context: Context, completion: @escaping (ComingUpEntry) -> Void) {
    completion(context.isPreview ? .placeholder : .at(Date(), from: Snapshot.load()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<ComingUpEntry>) -> Void) {
    let s = Snapshot.load()
    let cal = Calendar.current
    let now = Date()
    // Now, then each of the next 7 midnights, so "In 3 days" ticks down without the app.
    var dates = [now]
    var day = cal.startOfDay(for: now)
    for _ in 0..<7 {
      day = cal.date(byAdding: .day, value: 1, to: day)!
      dates.append(day)
    }
    completion(Timeline(entries: dates.map { .at($0, from: s) }, policy: .atEnd))
  }
}

// MARK: - Views

private func link(_ path: String) -> URL { URL(string: "pagewise://\(path)")! }

struct Header: View {
  var body: some View {
    Text("COMING UP")
      .font(.system(size: 11, weight: .bold))
      .tracking(0.6)
      .foregroundStyle(Color("muted"))
  }
}

struct RowView: View {
  let row: Row
  var body: some View {
    VStack(alignment: .leading, spacing: 1) {
      HStack(alignment: .firstTextBaseline) {
        Text(row.label).font(.system(size: 14, weight: .semibold)).foregroundStyle(Color("ink")).lineLimit(1)
        Spacer(minLength: 6)
        Text(row.when).font(.system(size: 12, weight: .semibold)).foregroundStyle(Color(row.soon ? "soon" : "calm"))
      }
      Text(row.docTitle).font(.system(size: 12)).foregroundStyle(Color("muted")).lineLimit(1)
    }
  }
}

struct CardsFooter: View {
  let count: Int
  var body: some View {
    Text("\(count) flashcard\(count == 1 ? "" : "s") to review")
      .font(.system(size: 12.5, weight: .semibold))
      .foregroundStyle(Color("calm"))
      .lineLimit(1)
  }
}

struct EmptyState: View {
  let hasDocs: Bool
  var body: some View {
    VStack(alignment: .leading, spacing: 3) {
      Text("Nothing due").font(.system(size: 16, weight: .semibold)).foregroundStyle(Color("ink"))
      Text(hasDocs ? "No deadlines in your documents." : "Share a PDF to Pagewise to start.")
        .font(.system(size: 12.5)).foregroundStyle(Color("muted")).lineLimit(2)
    }
  }
}

struct ComingUpView: View {
  @Environment(\.widgetFamily) var family
  let entry: ComingUpEntry

  var body: some View {
    switch family {
    case .accessoryRectangular:
      lockScreen
    default:
      home
    }
  }

  private var maxRows: Int {
    let base = family == .systemSmall ? 2 : family == .systemLarge ? 6 : 3
    return entry.cardsDue > 0 ? max(1, base - 1) : base
  }

  private var home: some View {
    VStack(alignment: .leading, spacing: 8) {
      Header()
      if entry.rows.isEmpty && entry.cardsDue == 0 {
        Spacer(minLength: 0)
        EmptyState(hasDocs: entry.hasDocs)
        Spacer(minLength: 0)
      } else {
        ForEach(entry.rows.prefix(maxRows)) { row in
          Link(destination: link("document/\(row.docId)")) { RowView(row: row) }
        }
        Spacer(minLength: 0)
        if entry.cardsDue > 0 {
          Link(destination: link(entry.studyDocId.map { "study/\($0)" } ?? "home")) { CardsFooter(count: entry.cardsDue) }
        }
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .widgetURL(link("home"))
    .containerBackground(for: .widget) { Color("$widgetBackground") }
  }

  private var lockScreen: some View {
    VStack(alignment: .leading, spacing: 1) {
      if let first = entry.rows.first {
        Text(first.when).font(.system(size: 12, weight: .semibold)).widgetAccentable()
        Text(first.label).font(.system(size: 14, weight: .semibold)).lineLimit(1)
        Text(first.docTitle).font(.system(size: 12)).lineLimit(1).foregroundStyle(.secondary)
      } else if entry.cardsDue > 0 {
        Text("Pagewise").font(.system(size: 12, weight: .semibold)).widgetAccentable()
        CardsFooter(count: entry.cardsDue)
      } else {
        Text("Pagewise").font(.system(size: 12, weight: .semibold)).widgetAccentable()
        Text("Nothing due").font(.system(size: 14, weight: .semibold))
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .widgetURL(entry.rows.first.map { link("document/\($0.docId)") } ?? link("home"))
    .containerBackground(for: .widget) { Color.clear }
  }
}

struct ComingUpWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "ComingUp", provider: Provider()) { entry in
      ComingUpView(entry: entry)
    }
    .configurationDisplayName("Coming up")
    .description("Deadlines from your documents and flashcards to review.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryRectangular])
  }
}
