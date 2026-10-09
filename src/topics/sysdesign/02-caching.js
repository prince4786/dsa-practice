export default {
  id: "caching",
  track: "sysdesign",
  title: "Caching & Eviction",
  difficulty: 1,
  minutes: 15,
  tags: ["caching", "lru", "lfu", "ttl", "thundering-herd", "invalidation"],

  explainer: [
    { type: "p", text: "A cache is just a small, fast copy of some data, kept close to where it's needed, on the bet that whatever gets requested next probably looks like what was requested a moment ago. Think of it like keeping a few frequently-used tools on your workbench instead of walking to the garage for every single one — most of the time the tool you need is already close by, and only occasionally do you have to make the slow trip. Everything interesting about caching comes down to three questions: **what do you throw away when the cache fills up**, **when does a cached copy become too old to trust**, and **what happens to the system the instant a piece of cached data disappears**." },

    { type: "h3", text: "The latency ladder — why caching pays off" },
    { type: "list", items: [
      "Reading from the CPU's L1 cache (a tiny, extremely fast memory built into the processor chip itself) takes roughly **1 nanosecond (ns)**; reading from main memory (RAM) takes roughly **100 ns**.",
      "A cache hit inside your own application process (an \"in-process\" cache — data kept in memory in the same program that needs it) takes roughly **~0.1 microseconds (µs)**; asking Redis (a separate, shared, in-memory database reachable over the network) takes roughly **0.5-1 millisecond (ms)**, because now you're also paying for a network round trip.",
      "A random read from an SSD takes roughly **100 µs**; a real query against an indexed database table takes roughly **1-10 ms**, because it may involve disk access, query planning, and lock coordination.",
      "A round trip to a server on the other side of the world (\"cross-region\") takes roughly **80-150 ms**, dominated purely by the speed of light through fiber-optic cable."
    ]},
    { type: "p", text: "Put those together and a Redis hit is roughly **10× faster** than a database query, while an in-process hit is roughly **1000× faster**. That gap is why the cache **hit rate** (the fraction of requests a cache can answer without going to the database) matters so much. At a 90% hit rate, with a 1 ms cache and a 10 ms database, the average latency works out to `0.9×1 + 0.1×10 = 1.9 ms`. Push the hit rate to 99% and it drops to `1.09 ms`. Drop it to 50% and it rises to `5.5 ms` — and just as importantly, the database now sees **5× more traffic** than it did at 90%. In practice it's usually that second effect — protecting the database from load, not shaving milliseconds off latency — that actually saves the system during a traffic spike." },

    { type: "h3", text: "Eviction policies — what gets thrown out when the cache is full" },
    {"type": "p", "text": "Imagine a desk with room for only three tools. A fourth tool arrives: which one do you put away? Eviction removes a cached copy to make space; it does not delete the original data from the database."},
    {"type": "image", "src": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%221000%22%20height%3D%22920%22%20viewBox%3D%220%200%201000%20920%22%20role%3D%22img%22%20aria-labelledby%3D%22title%20desc%22%3E%3Ctitle%20id%3D%22title%22%3ECache%20full%3A%20who%20leaves%3F%3C/title%3E%3Cdesc%20id%3D%22desc%22%3ESame%20cache%20A%20B%20C%2C%20new%20item%20D%20arrives.%20LRU%20removes%20B%2C%20LFU%20C%2C%20FIFO%20A%2C%20CLOCK%20B%20with%20the%20shown%20flags%20and%20hand%2C%20random%20any%20item.%3C/desc%3E%3Crect%20width%3D%221000%22%20height%3D%22920%22%20rx%3D%2220%22%20fill%3D%22%23101827%22/%3E%3Cg%20font-family%3D%22Arial%2Csans-serif%22%3E%3Ctext%20x%3D%2240%22%20y%3D%2258%22%20font-size%3D%2232%22%20font-weight%3D%22bold%22%20fill%3D%22%23ffffff%22%3ECache%20full%3A%20who%20leaves%3F%3C/text%3E%3Ctext%20x%3D%2240%22%20y%3D%2295%22%20font-size%3D%2219%22%20fill%3D%22%23cbd5e1%22%3EThree%20slots%3A%20%5B%20A%20%5D%20%5B%20B%20%5D%20%5B%20C%20%5D%20%20%20%2B%20%20%20new%20item%20D%20%E2%86%92%20one%20item%20must%20leave%3C/text%3E%3Ctext%20x%3D%2240%22%20y%3D%22125%22%20font-size%3D%2216%22%20fill%3D%22%2394a3b8%22%3EEach%20row%20applies%20a%20different%20rule%20to%20the%20same%20cache.%3C/text%3E%3Crect%20x%3D%2230%22%20y%3D%22155%22%20width%3D%22940%22%20height%3D%22124%22%20rx%3D%2212%22%20fill%3D%22%231e293b%22/%3E%3Ctext%20x%3D%2250%22%20y%3D%22187%22%20font-size%3D%2223%22%20font-weight%3D%22bold%22%20fill%3D%22%237dd3fc%22%3ELRU%3C/text%3E%3Ctext%20x%3D%22210%22%20y%3D%22187%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3ERemove%20the%20least%20recently%20used%3C/text%3E%3Ctext%20x%3D%2250%22%20y%3D%22221%22%20font-size%3D%2217%22%20fill%3D%22%23cbd5e1%22%3ELast%20used%3A%20A%20now%20%C2%B7%20B%2010%20min%20ago%20%C2%B7%20C%201%20min%20ago%3C/text%3E%3Crect%20x%3D%2250%22%20y%3D%22235%22%20width%3D%2258%22%20height%3D%2232%22%20rx%3D%226%22%20fill%3D%22%23334155%22/%3E%3Ctext%20x%3D%2279%22%20y%3D%22258%22%20text-anchor%3D%22middle%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EA%3C/text%3E%3Crect%20x%3D%22124%22%20y%3D%22235%22%20width%3D%2258%22%20height%3D%2232%22%20rx%3D%226%22%20fill%3D%22%23fb7185%22/%3E%3Ctext%20x%3D%22153%22%20y%3D%22258%22%20text-anchor%3D%22middle%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EB%3C/text%3E%3Crect%20x%3D%22198%22%20y%3D%22235%22%20width%3D%2258%22%20height%3D%2232%22%20rx%3D%226%22%20fill%3D%22%23334155%22/%3E%3Ctext%20x%3D%22227%22%20y%3D%22258%22%20text-anchor%3D%22middle%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EC%3C/text%3E%3Ctext%20x%3D%22300%22%20y%3D%22258%22%20font-size%3D%2218%22%20fill%3D%22%23fda4af%22%3ERemove%20B%3C/text%3E%3Ctext%20x%3D%22590%22%20y%3D%22258%22%20font-size%3D%2218%22%20fill%3D%22%2386efac%22%3EThen%20insert%20D%3C/text%3E%3Crect%20x%3D%2230%22%20y%3D%22295%22%20width%3D%22940%22%20height%3D%22124%22%20rx%3D%2212%22%20fill%3D%22%231e293b%22/%3E%3Ctext%20x%3D%2250%22%20y%3D%22327%22%20font-size%3D%2223%22%20font-weight%3D%22bold%22%20fill%3D%22%237dd3fc%22%3ELFU%3C/text%3E%3Ctext%20x%3D%22210%22%20y%3D%22327%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3ERemove%20the%20least%20often%20used%3C/text%3E%3Ctext%20x%3D%2250%22%20y%3D%22361%22%20font-size%3D%2217%22%20fill%3D%22%23cbd5e1%22%3ERequests%3A%20A%208%20times%20%C2%B7%20B%205%20times%20%C2%B7%20C%201%20time%3C/text%3E%3Crect%20x%3D%2250%22%20y%3D%22375%22%20width%3D%2258%22%20height%3D%2232%22%20rx%3D%226%22%20fill%3D%22%23334155%22/%3E%3Ctext%20x%3D%2279%22%20y%3D%22398%22%20text-anchor%3D%22middle%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EA%3C/text%3E%3Crect%20x%3D%22124%22%20y%3D%22375%22%20width%3D%2258%22%20height%3D%2232%22%20rx%3D%226%22%20fill%3D%22%23334155%22/%3E%3Ctext%20x%3D%22153%22%20y%3D%22398%22%20text-anchor%3D%22middle%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EB%3C/text%3E%3Crect%20x%3D%22198%22%20y%3D%22375%22%20width%3D%2258%22%20height%3D%2232%22%20rx%3D%226%22%20fill%3D%22%23fb7185%22/%3E%3Ctext%20x%3D%22227%22%20y%3D%22398%22%20text-anchor%3D%22middle%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EC%3C/text%3E%3Ctext%20x%3D%22300%22%20y%3D%22398%22%20font-size%3D%2218%22%20fill%3D%22%23fda4af%22%3ERemove%20C%3C/text%3E%3Ctext%20x%3D%22590%22%20y%3D%22398%22%20font-size%3D%2218%22%20fill%3D%22%2386efac%22%3EThen%20insert%20D%3C/text%3E%3Crect%20x%3D%2230%22%20y%3D%22435%22%20width%3D%22940%22%20height%3D%22124%22%20rx%3D%2212%22%20fill%3D%22%231e293b%22/%3E%3Ctext%20x%3D%2250%22%20y%3D%22467%22%20font-size%3D%2223%22%20font-weight%3D%22bold%22%20fill%3D%22%237dd3fc%22%3EFIFO%3C/text%3E%3Ctext%20x%3D%22210%22%20y%3D%22467%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3ERemove%20the%20first%20item%20inserted%3C/text%3E%3Ctext%20x%3D%2250%22%20y%3D%22501%22%20font-size%3D%2217%22%20fill%3D%22%23cbd5e1%22%3EArrival%20order%3A%20A%20%E2%86%92%20B%20%E2%86%92%20C.%20Reading%20A%20does%20not%20save%20it.%3C/text%3E%3Crect%20x%3D%2250%22%20y%3D%22515%22%20width%3D%2258%22%20height%3D%2232%22%20rx%3D%226%22%20fill%3D%22%23fb7185%22/%3E%3Ctext%20x%3D%2279%22%20y%3D%22538%22%20text-anchor%3D%22middle%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EA%3C/text%3E%3Crect%20x%3D%22124%22%20y%3D%22515%22%20width%3D%2258%22%20height%3D%2232%22%20rx%3D%226%22%20fill%3D%22%23334155%22/%3E%3Ctext%20x%3D%22153%22%20y%3D%22538%22%20text-anchor%3D%22middle%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EB%3C/text%3E%3Crect%20x%3D%22198%22%20y%3D%22515%22%20width%3D%2258%22%20height%3D%2232%22%20rx%3D%226%22%20fill%3D%22%23334155%22/%3E%3Ctext%20x%3D%22227%22%20y%3D%22538%22%20text-anchor%3D%22middle%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EC%3C/text%3E%3Ctext%20x%3D%22300%22%20y%3D%22538%22%20font-size%3D%2218%22%20fill%3D%22%23fda4af%22%3ERemove%20A%3C/text%3E%3Ctext%20x%3D%22590%22%20y%3D%22538%22%20font-size%3D%2218%22%20fill%3D%22%2386efac%22%3EThen%20insert%20D%3C/text%3E%3Crect%20x%3D%2230%22%20y%3D%22575%22%20width%3D%22940%22%20height%3D%22124%22%20rx%3D%2212%22%20fill%3D%22%231e293b%22/%3E%3Ctext%20x%3D%2250%22%20y%3D%22607%22%20font-size%3D%2223%22%20font-weight%3D%22bold%22%20fill%3D%22%237dd3fc%22%3ECLOCK%3C/text%3E%3Ctext%20x%3D%22210%22%20y%3D%22607%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EScan%3B%20give%20recently%20used%20items%20a%20second%20chance%3C/text%3E%3Ctext%20x%3D%2250%22%20y%3D%22641%22%20font-size%3D%2217%22%20fill%3D%22%23cbd5e1%22%3EHand%20starts%20at%20A%3A%20A%3D1%20%E2%86%92%20clear%20%26amp%3B%20skip%3B%20B%3D0%20%E2%86%92%20remove.%3C/text%3E%3Crect%20x%3D%2250%22%20y%3D%22655%22%20width%3D%2258%22%20height%3D%2232%22%20rx%3D%226%22%20fill%3D%22%23334155%22/%3E%3Ctext%20x%3D%2279%22%20y%3D%22678%22%20text-anchor%3D%22middle%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EA%3C/text%3E%3Crect%20x%3D%22124%22%20y%3D%22655%22%20width%3D%2258%22%20height%3D%2232%22%20rx%3D%226%22%20fill%3D%22%23fb7185%22/%3E%3Ctext%20x%3D%22153%22%20y%3D%22678%22%20text-anchor%3D%22middle%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EB%3C/text%3E%3Crect%20x%3D%22198%22%20y%3D%22655%22%20width%3D%2258%22%20height%3D%2232%22%20rx%3D%226%22%20fill%3D%22%23334155%22/%3E%3Ctext%20x%3D%22227%22%20y%3D%22678%22%20text-anchor%3D%22middle%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EC%3C/text%3E%3Ctext%20x%3D%22300%22%20y%3D%22678%22%20font-size%3D%2218%22%20fill%3D%22%23fda4af%22%3ERemove%20B%3C/text%3E%3Ctext%20x%3D%22590%22%20y%3D%22678%22%20font-size%3D%2218%22%20fill%3D%22%2386efac%22%3EThen%20insert%20D%3C/text%3E%3Crect%20x%3D%2230%22%20y%3D%22715%22%20width%3D%22940%22%20height%3D%22124%22%20rx%3D%2212%22%20fill%3D%22%231e293b%22/%3E%3Ctext%20x%3D%2250%22%20y%3D%22747%22%20font-size%3D%2223%22%20font-weight%3D%22bold%22%20fill%3D%22%237dd3fc%22%3ERandom%3C/text%3E%3Ctext%20x%3D%22210%22%20y%3D%22747%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EChoose%20any%20item%20at%20random%3C/text%3E%3Ctext%20x%3D%2250%22%20y%3D%22781%22%20font-size%3D%2217%22%20fill%3D%22%23cbd5e1%22%3EA%2C%20B%2C%20or%20C%20can%20leave.%20No%20usage%20history%20needed.%3C/text%3E%3Crect%20x%3D%2250%22%20y%3D%22795%22%20width%3D%2258%22%20height%3D%2232%22%20rx%3D%226%22%20fill%3D%22%23334155%22/%3E%3Ctext%20x%3D%2279%22%20y%3D%22818%22%20text-anchor%3D%22middle%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EA%3C/text%3E%3Crect%20x%3D%22124%22%20y%3D%22795%22%20width%3D%2258%22%20height%3D%2232%22%20rx%3D%226%22%20fill%3D%22%23334155%22/%3E%3Ctext%20x%3D%22153%22%20y%3D%22818%22%20text-anchor%3D%22middle%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EB%3C/text%3E%3Crect%20x%3D%22198%22%20y%3D%22795%22%20width%3D%2258%22%20height%3D%2232%22%20rx%3D%226%22%20fill%3D%22%23334155%22/%3E%3Ctext%20x%3D%22227%22%20y%3D%22818%22%20text-anchor%3D%22middle%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EC%3C/text%3E%3Ctext%20x%3D%22300%22%20y%3D%22818%22%20font-size%3D%2218%22%20fill%3D%22%23fda4af%22%3ERemove%20A%2C%20B%2C%20or%20C%3C/text%3E%3Ctext%20x%3D%22590%22%20y%3D%22818%22%20font-size%3D%2218%22%20fill%3D%22%2386efac%22%3EThen%20insert%20D%3C/text%3E%3Ctext%20x%3D%2240%22%20y%3D%22890%22%20font-size%3D%2217%22%20fill%3D%22%23cbd5e1%22%3ERemember%3A%20LRU%20%3D%20when%20%C2%B7%20LFU%20%3D%20how%20often%20%C2%B7%20FIFO%20%3D%20arrival%20%C2%B7%20CLOCK%20%3D%20second%20chance%3C/text%3E%3C/g%3E%3C/svg%3E", "text": "Cache eviction comparison: with A, B, C cached and D arriving, LRU removes B (oldest last use), LFU C (fewest requests), FIFO A (first arrival), CLOCK B (A has flag 1, B flag 0, hand at A), and Random any item."},
    {"type": "list", "items": ["**LRU — least recently used:** remove the item you have not used for the longest time. Think of clearing the tool you have not touched lately from a small desk. Good when recent requests repeat. A long one-time scan can push useful items out.", "**LFU — least frequently used:** remove the item requested the fewest times. Think of keeping the most popular tools. An old favorite can stay too long if its lifetime count remains high. Aging or resetting counts lets the cache adapt. TinyLFU estimates recent popularity to help decide whether a new item deserves entry; Caffeine's W-TinyLFU combines this with a small recency window.", "**FIFO — first in, first out:** remove the item that entered first. Like a queue: the oldest arrival leaves, even if you just used it. Simple, but it can throw away a busy item.", "**CLOCK — second chance:** keep items in a circle and remember one flag per item. Access sets its flag to 1. When space is needed, a pointer scans: flag 1 means clear it to 0 and skip; flag 0 means evict. This cheaply approximates recency without keeping an exact last-use order. CLOCK-style ideas are used in memory management; actual operating-system algorithms vary.", "**Random:** choose any cached item at random. Very little tracking is needed, but a useful item may be unlucky. Results depend on the workload. Random choices are less predictable than LRU; they do not make a cache immune to attacks."]},
    {"type": "p", "text": "In the graphic, each row starts fresh from A, B, C. The CLOCK result depends on both the flags and the pointer position. LFU needs a tie-break rule when counts match, often LRU."},

    {"type": "h3", "text": "Watch each algorithm choose a victim"},
    {"type": "p", "text": "Press Play for an animation, or Next to go at your own pace. Each example uses three slots. A hit means the item is already cached; a miss means it must be fetched. On a full-cache miss, these examples admit the new item after evicting one old item."},
    {"type": "steps", "text": "LRU: move each used item to the recent end", "frames": [{"slots": ["A · oldest", "B", "C · newest"], "text": "The row is ordered by last use: least recent on the left, most recent on the right."}, {"slots": ["A · oldest", "B", "C · newest"], "text": "Request A: a hit. Move A to the most recent end.", "focus": 0}, {"slots": ["B · oldest", "C", "A · newest"], "text": "A is now recent. B has gone the longest without being used.", "focus": 2}, {"slots": ["B · REMOVE", "C", "A"], "text": "Request D: a miss, and all slots are full. Remove B from the least recent end.", "focus": 0}, {"slots": ["C · oldest", "A", "D · newest"], "text": "Insert D at the most recent end. A hit changes the order; a miss inserts a new item.", "focus": 2}]},
    {"type": "steps", "text": "LFU: increase counts, then remove the smallest", "frames": [{"slots": ["A · count 2", "B · count 1", "C · count 1"], "text": "Track a request count for each item. For ties, this example removes the least recently used; B is older than C."}, {"slots": ["A · count 2", "B · count 1", "C · count 1"], "text": "Request C: a hit. Increase only C’s count.", "focus": 2}, {"slots": ["A · count 2", "B · count 1", "C · count 2"], "text": "C’s count becomes 2. B now has the smallest count.", "focus": 2}, {"slots": ["A · count 2", "B · REMOVE", "C · count 2"], "text": "Request D: a miss with a full cache. Remove B, whose count is 1.", "focus": 1}, {"slots": ["A · count 2", "D · count 1", "C · count 2"], "text": "Insert D with count 1. Basic LFU keeps counts; aging variants reduce old counts over time.", "focus": 1}]},
    {"type": "steps", "text": "FIFO: hits leave the arrival queue alone", "frames": [{"slots": ["A · first in", "B", "C · last in"], "text": "Queue order records insertion time, not last use."}, {"slots": ["A · HIT", "B", "C"], "text": "Request A: a hit. The queue does not move. A is still the oldest arrival.", "focus": 0}, {"slots": ["A · REMOVE", "B", "C"], "text": "Request D: a miss with a full cache. Remove A from the front, even though A was just used.", "focus": 0}, {"slots": ["B · first in", "C", "D · last in"], "text": "Insert D at the back. B will be the next victim if another new item arrives.", "focus": 2}]},
    {"type": "steps", "text": "CLOCK: scan flags and give second chances", "frames": [{"slots": ["→ A · bit 1", "B · bit 1", "C · bit 0"], "text": "Slots form a circle. The hand starts at A. Access sets an item’s bit to 1; bits are not usage counts.", "focus": 0}, {"slots": ["→ A · bit 1", "B · bit 1", "C · bit 0"], "text": "D arrives and needs a slot. A has bit 1, so give A a second chance: clear its bit and advance.", "focus": 0}, {"slots": ["A · bit 0", "→ B · bit 1", "C · bit 0"], "text": "B also has bit 1. Clear B’s bit and advance; do not evict B on this visit.", "focus": 1}, {"slots": ["A · bit 0", "B · bit 0", "→ C · REMOVE"], "text": "C has bit 0. Evict C: it gets no second chance on this visit.", "focus": 2}, {"slots": ["→ A · bit 0", "B · bit 0", "D · bit 1"], "text": "Insert D in C’s slot with bit 1 because the request accessed it. Advance the hand to A, wrapping around.", "focus": 0}, {"slots": ["→ A · bit 0", "B · bit 1", "D · bit 1"], "text": "A later hit on B sets B’s bit to 1 again. A hit does not move the hand.", "focus": 1}]},
    {"type": "steps", "text": "Random: draw a slot, without checking history", "frames": [{"slots": ["A · slot 0", "B · slot 1", "C · slot 2"], "text": "No recency list or frequency counts are needed. Hits do not affect the victim choice."}, {"slots": ["A · slot 0", "B · slot 1", "C · slot 2"], "text": "D arrives and the cache is full. Draw a random occupied slot: 0, 1, or 2."}, {"slots": ["A · slot 0", "B · REMOVE", "C · slot 2"], "text": "This demonstration draws slot 1, so B leaves. A different draw could remove A or C.", "focus": 1}, {"slots": ["A · slot 0", "D · slot 1", "C · slot 2"], "text": "Put D in the freed slot. Replay shows the same illustrative draw; it is not a new random experiment.", "focus": 1}]},

    { type: "h3", text: "The three write strategies — how the cache and the database stay in sync" },
    { type: "list", items: [
      "**Cache-aside (also called lazy loading)** — the application checks the cache first; on a miss, it reads the database and then writes the fresh value into the cache. This is the default choice for most systems: only data that's actually been requested ever ends up cached. The cost is a slower first request for any \"cold\" key, and a race window if two requests miss and refill the same key concurrently.",
      "**Write-through** — every write goes to the cache and the database together, in the same operation. The cache is never stale, but every write pays the cost of both writes, and you end up caching data that might never be read again.",
      "**Write-behind (or write-back)** — a write updates the cache immediately and is flushed to the database asynchronously, later. Writes feel instant and the cache can absorb sudden write spikes, but **if the cache dies before that flush happens, the write is gone for good**. Only acceptable for data that can tolerate some loss, like view counters or engagement tallies — never for anything that must be durable."
    ]},

    { type: "callout", tone: "pitfall", text: "On a write, **delete the cache entry rather than updating it in place**. Here's why: two writers updating the same key concurrently can commit to the database in one order but happen to write to the cache in the opposite order — leaving the cache holding the *older* value forever, with nothing to correct it. Deleting is **idempotent** (doing it once or five times has the same effect), and it simply forces the next read to go fetch a fresh value from the database." },

    { type: "h3", text: "Three failure modes worth naming by name" },
    { type: "list", items: [
      "**Thundering herd / cache stampede** — a single very popular (\"hot\") key expires, and thousands of concurrent requests all miss at the exact same instant and all hammer the database simultaneously to refill it. Fixes: **single-flight** (only the very first request that misses actually goes to the database; every other concurrent request for that same key waits on that one in-flight fetch and shares its result), a short-lived lock/lease on the key so only one worker refills it, or **stale-while-revalidate** (keep serving the just-expired value to everyone while exactly one background worker quietly refreshes it).",
      "**Cache penetration** — repeated requests for keys that simply don't exist (say, someone probing invalid user IDs) never find anything in the cache and always fall through to hit the database directly. Fix: cache the *negative* result too, with a short TTL, or put a **Bloom filter** (a compact, probabilistic data structure that can quickly say \"this key definitely doesn't exist\" or \"this key might exist\" using very little memory) in front to reject obviously-invalid lookups before they ever reach the database.",
      "**Cache avalanche** — a batch of keys that were all warmed up at the same moment (say, at deploy time) share the same TTL, and therefore all expire in the same second, causing a mass simultaneous miss. Fix: **jitter the TTL** — instead of a fixed expiry, use something like `ttl × (0.9 + 0.2 × random())` so expirations spread out over time instead of landing all at once."
    ]},

    { type: "h3", text: "Invalidation — TTL is not the same thing" },
    { type: "p", text: "A **TTL** (Time To Live — how long an entry is allowed to sit in the cache before it's automatically considered expired) is not invalidation. It's *bounded staleness that you have explicitly agreed to accept*: a 60-second TTL means you've decided it's fine for users to sometimes see data up to 60 seconds old. Real invalidation — making sure a cache entry disappears the moment the underlying data actually changes — needs an event to trigger it: deleting the cache entry on every write, a **CDC** (Change Data Capture — a stream of every row-level change read directly off the database's own replication log) pipeline that reacts to changes as they happen, or versioned keys like `user:42:v7`, where bumping the version number simply makes every old key unreachable and it quietly ages out on its own." },

    { type: "callout", tone: "tip", text: "In an interview, always state your hit-rate assumption out loud and derive the resulting database load from it. \"At a 95% hit rate, 100k requests per second of reads becomes only 5k requests per second hitting the database\" is the sentence that shows you understand what a cache is actually *for* — protecting the thing behind it, not just being fast." }
  ],

  glossary: [
    { term: "Hit rate", plain: "The fraction of requests a cache can answer directly, without needing to go fetch the data from the slower system (usually a database) behind it." },
    { term: "L1 cache", plain: "A tiny, extremely fast memory built directly into a CPU chip, used to hold the data the processor is most likely to need next." },
    { term: "In-process cache", plain: "A cache stored in the memory of the same running program that needs the data, so there's no network hop to read it — the fastest kind of cache, but not shared between different servers." },
    { term: "TTL (Time To Live)", plain: "How long a cached entry is allowed to sit before it's automatically treated as expired, whether or not the underlying data actually changed." },
    { term: "LRU (Least Recently Used)", plain: "An eviction policy that throws out whichever cache entry hasn't been accessed in the longest time, on the theory that recently-used things get used again soon." },
    { term: "LFU (Least Frequently Used)", plain: "An eviction policy that throws out whichever cache entry has been accessed the fewest number of times overall." },
    { term: "TinyLFU / Caffeine", plain: "TinyLFU is a compact technique for estimating how popular a key has recently been without storing a full history. Caffeine is a popular Java caching library that uses it." },
    { term: "Cache-aside", plain: "A caching pattern where the application checks the cache first, and on a miss reads the real data source and stores the result in the cache for next time." },
    { term: "Cache stampede / thundering herd", plain: "The moment a popular cache entry expires and a huge number of requests all miss at once, all trying to refetch the same thing from the database simultaneously." },
    { term: "Single-flight", plain: "A technique where, if many requests need the same missing piece of data at once, only the first one actually goes and fetches it — the rest simply wait for that one fetch to finish and share its result." },
    { term: "Bloom filter", plain: "A small, memory-efficient data structure that can quickly tell you 'this definitely isn't in the set' or 'this might be in the set' — used to reject lookups for keys that certainly don't exist before they burden a slower system." },
    { term: "CDC (Change Data Capture)", plain: "A technique for streaming every change made to a database (inserts, updates, deletes) as it happens, usually by reading the database's own internal replication log, so other systems can react to changes in near real time." }
  ],

  complexity: {
    rows: [
      { operation: "LRU get / put", time: "O(1)", space: "O(capacity)", note: "hash map + doubly-linked list" },
      { operation: "LFU get / put", time: "O(1)", space: "O(capacity)", note: "freq buckets of linked lists" },
      { operation: "TTL expiry", time: "O(1) lazy, O(n) sampled", space: "O(1)", note: "Redis samples on access + a background sweep" },
      { operation: "Avg read latency", time: "h·t_cache + (1−h)·(t_cache + t_db)", space: "—", note: "a miss costs you the lookup too" },
      { operation: "DB load", time: "(1−h) × rps", space: "—", note: "the number that actually matters" }
    ]
  },

  interview: {
    whyAsked: "Caching is where you find out whether a candidate reasons about *consistency and failure*, or just says 'add Redis'. The signal is naming a specific eviction policy with its failure mode, choosing delete-over-update on writes, and knowing what happens the microsecond a hot key expires.",
    followUps: [
      { q: "LRU or LFU — pick one and justify it.", a: "LRU by default: it is O(1), trivially correct, and matches how real traffic exhibits temporal locality. I switch when the workload has a periodic scan (an analytics job walking the whole table) which LRU handles catastrophically — it flushes the working set. Then I want scan resistance: LFU, or better W-TinyLFU, which keeps a decaying frequency sketch plus a small LRU admission window so a one-off scan never gets admitted at all." },
      { q: "A celebrity key expires and you get 10,000 simultaneous misses. What happens and what do you do?", a: "All 10,000 requests miss, all issue the same DB query, the DB saturates, latency spikes, and requests time out and retry — that is the stampede. The fix is single-flight: the first miss takes a per-key lock or in-flight-promise map and does the fetch, everyone else waits on it, so the DB sees exactly one query. Better still, serve stale-while-revalidate: return the expired value immediately and refresh in the background, so nobody waits at all. And always jitter TTLs so keys don't expire in lockstep." },
      { q: "Why delete the cache key on write instead of updating it?", a: "Because two concurrent writers can commit to the DB in one order and update the cache in the other, leaving a permanently wrong value with no self-healing. Deletion is idempotent — whatever order the deletes land, the next read repopulates from the DB. The residual race (a slow reader writing back a stale value it read before someone else's commit) is small, and is closed by delayed double-delete or by versioning the key." },
      { q: "How do you keep a cache consistent with the database?", a: "You don't get strong consistency cheaply — you pick a bounded staleness. Cache-aside with delete-on-write plus a modest TTL as a safety net covers most cases. If staleness genuinely matters, drive invalidation off the database's replication log via CDC (Debezium reading the binlog), which is ordered and survives an app crash mid-write — the failure mode of app-side deletes. For read-your-own-writes specifically, route the user's reads to the primary, or write a short-lived per-user marker that forces a cache bypass." },
      { q: "Where would you put the cache — in the process, or in Redis?", a: "Both, in layers. An in-process LRU is ~0.1 µs and takes the hottest few thousand keys and all the network cost with it, but every replica has its own copy so invalidation is a broadcast problem and memory is duplicated N times. Redis is ~0.5 ms, shared, invalidated once, and can hold far more. The standard shape is a small local cache with a very short TTL (seconds) in front of a large shared Redis — accept the local staleness explicitly." },
      { q: "How do you size the cache?", a: "Start from the working set, not the total data. Plot hit rate vs cache size — it is a sharply diminishing curve, and the knee is where you stop paying. Concretely: if 20% of keys serve 80% of traffic, caching that 20% gets you to ~80% hit rate and the next 20% of memory buys maybe 8 points. Then check the memory bill against the DB replicas that hit rate lets you *not* buy." }
    ]
  },

  code: [
    { lang: "python", label: "LRU cache from scratch (map + doubly-linked list)", code: "class Node:\n    __slots__ = (\"k\", \"v\", \"prev\", \"next\", \"exp\")\n    def __init__(self, k, v, exp):\n        self.k, self.v, self.exp = k, v, exp\n        self.prev = self.next = None\n\nclass LRUCache:\n    def __init__(self, capacity):\n        self.cap = capacity\n        self.map = {}\n        self.head = Node(None, None, 0)     # MRU sentinel\n        self.tail = Node(None, None, 0)     # LRU sentinel\n        self.head.next, self.tail.prev = self.tail, self.head\n\n    def _unlink(self, n):\n        n.prev.next, n.next.prev = n.next, n.prev\n\n    def _push_front(self, n):\n        n.next, n.prev = self.head.next, self.head\n        self.head.next.prev = self.head.next = n\n\n    def get(self, k, now):\n        n = self.map.get(k)\n        if n is None:\n            return None                      # miss\n        if n.exp and now >= n.exp:            # lazy TTL expiry\n            self._unlink(n); del self.map[k]\n            return None\n        self._unlink(n); self._push_front(n)  # touch -> becomes MRU\n        return n.v\n\n    def put(self, k, v, now, ttl=None):\n        if k in self.map:\n            self._unlink(self.map[k])\n        elif len(self.map) >= self.cap:\n            victim = self.tail.prev           # evict LRU\n            self._unlink(victim); del self.map[victim.k]\n        n = Node(k, v, now + ttl if ttl else 0)\n        self.map[k] = n\n        self._push_front(n)" },
    { lang: "python", label: "Cache-aside with single-flight + TTL jitter", code: "import asyncio, random\n\n_inflight = {}          # key -> Future, THE stampede fix\n\nasync def get_user(uid):\n    key = f\"user:{uid}\"\n    hit = await redis.get(key)\n    if hit is not None:\n        return decode(hit)\n\n    # Single-flight: only the first misser touches the database.\n    fut = _inflight.get(key)\n    if fut is not None:\n        return await fut                    # 9,999 requests park here\n\n    fut = asyncio.get_event_loop().create_future()\n    _inflight[key] = fut\n    try:\n        row = await db.fetch_one(\"SELECT * FROM users WHERE id=$1\", uid)\n        if row is None:\n            # Negative caching: stops cache PENETRATION on bogus ids.\n            await redis.set(key, TOMBSTONE, ex=30)\n        else:\n            ttl = int(300 * (0.9 + 0.2 * random.random()))  # jitter -> no avalanche\n            await redis.set(key, encode(row), ex=ttl)\n        fut.set_result(row)\n        return row\n    except Exception as e:\n        fut.set_exception(e)\n        raise\n    finally:\n        _inflight.pop(key, None)\n\nasync def update_user(uid, patch):\n    await db.update(uid, patch)\n    await redis.delete(f\"user:{uid}\")       # DELETE, never SET\n    # optional: delayed double-delete to close the slow-reader race\n    asyncio.create_task(_delayed_delete(f\"user:{uid}\", 0.5))" },
    { lang: "javascript", label: "Stale-while-revalidate", code: "// Nobody ever waits for a refresh: the expired value is served immediately\n// and exactly one background job repopulates it.\nasync function swr(key, fetcher, { fresh = 60_000, stale = 600_000 }) {\n  const e = store.get(key);                       // { value, at }\n  const age = e ? Date.now() - e.at : Infinity;\n\n  if (e && age < fresh) return e.value;           // fresh hit\n\n  if (e && age < stale) {                         // stale but usable\n    if (!refreshing.has(key)) {                   // single-flight the refresh\n      refreshing.add(key);\n      fetcher(key)\n        .then(v => store.set(key, { value: v, at: Date.now() }))\n        .finally(() => refreshing.delete(key));\n    }\n    return e.value;                               // serve stale NOW\n  }\n  return await coalesce(key, fetcher);            // truly cold: must wait\n}" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.9, maxFrames: 320 },

    params: [
      { key: "capacity", label: "Cache slots", type: "int", min: 3, max: 10, default: 6 },
      { key: "policy", label: "Eviction", type: "enum", options: ["lru", "lfu", "fifo"], default: "lru" },
      { key: "keyspace", label: "Distinct keys", type: "int", min: 8, max: 30, default: 16 },
      { key: "ttl", label: "TTL (ticks, 0 = off)", type: "int", min: 0, max: 40, default: 0 },
      { key: "requests", label: "Requests", type: "int", min: 24, max: 90, default: 50 },
      { key: "seed", label: "Re-roll traffic", type: "seed" }
    ],

    frames: function* (params, rng) {
      const CAP = params.capacity;
      const K = params.keyspace;
      const TTL = params.ttl;
      const N = params.requests;
      const POL = params.policy;

      // Zipf-ish popularity: key 0 is the celebrity.
      const weights = [];
      let wsum = 0;
      for (let i = 0; i < K; i++) { const w = 1 / Math.pow(i + 1, 1.1); weights.push(w); wsum += w; }
      const pick = () => {
        let r = rng() * wsum;
        for (let i = 0; i < K; i++) { r -= weights[i]; if (r <= 0) return i; }
        return K - 1;
      };

      let entries = [];   // { key, lastUsed, freq, insertedAt, expiresAt }
      let hits = 0, misses = 0, expired = 0, evictions = 0;
      let originNaive = 0, originSF = 0;
      const stream = [];
      const rate = [];

      const snapEntries = () => entries.map((e) => ({
        key: e.key, lastUsed: e.lastUsed, freq: e.freq, insertedAt: e.insertedAt, expiresAt: e.expiresAt
      }));
      const stack = () => entries.slice().sort((a, b) => b.lastUsed - a.lastUsed).map((e) => e.key);

      const base = (t, extra) => Object.assign({
        entries: snapEntries(), order: stack(), cap: CAP, policy: POL, ttl: TTL,
        t: t, hits: hits, misses: misses, expired: expired, evictions: evictions,
        originNaive: originNaive, originSF: originSF,
        stream: stream.slice(-14), rate: rate.slice(), keyspace: K,
        cur: null, result: "", victim: null, conc: 1
      }, extra || {});

      yield {
        label: `${CAP}-slot ${POL.toUpperCase()} cache over ${K} keys with Zipf traffic (k0 is the celebrity). ${TTL ? `TTL = ${TTL} ticks.` : "No TTL — entries live until evicted."}`,
        phase: "init",
        state: base(0)
      };

      for (let t = 1; t <= N; t++) {
        const kid = pick();
        const key = "k" + kid;
        // The celebrity key attracts concurrent duplicate requests — that is what
        // makes its expiry a stampede rather than a single miss.
        const conc = kid === 0 ? 3 + Math.floor(rng() * 5) : 1;

        // --- lazy TTL expiry on access ---------------------------------------
        if (TTL > 0) {
          const before = entries.length;
          const dead = entries.filter((e) => e.expiresAt > 0 && t >= e.expiresAt).map((e) => e.key);
          if (dead.length) {
            entries = entries.filter((e) => !(e.expiresAt > 0 && t >= e.expiresAt));
            expired += before - entries.length;
            yield {
              label: `Tick ${t}: TTL expired ${dead.join(", ")} — expiry is not a miss yet, but it is a miss waiting to happen. Un-jittered TTLs expire in lockstep: that is an avalanche.`,
              phase: "expire",
              state: base(t, { cur: null, result: "expire", victim: dead.join(",") })
            };
          }
        }

        const idx = entries.findIndex((e) => e.key === key);
        if (idx >= 0) {
          hits += 1;
          const e = entries[idx];
          const next = entries.slice();
          next[idx] = { key: e.key, lastUsed: t, freq: e.freq + 1, insertedAt: e.insertedAt, expiresAt: e.expiresAt };
          entries = next;
          stream.push({ key: key, hit: true });
          const hr = hits / (hits + misses);
          rate.push(hr);
          yield {
            label: `HIT on ${key} (freq ${entries[idx].freq}). ${POL === "lru" ? `${key} moves to the top of the recency stack.` : POL === "lfu" ? `Frequency count bumps; recency is ignored.` : `FIFO ignores the touch entirely — insertion order is all that matters.`} Hit rate ${(hr * 100).toFixed(0)}%.`,
            phase: "hit",
            focus: [kid],
            state: base(t, { cur: key, result: "hit", conc: conc })
          };
        } else {
          misses += 1;
          originNaive += conc;     // every concurrent misser hits the origin
          originSF += 1;           // single-flight collapses them into one
          stream.push({ key: key, hit: false });

          let victim = null;
          if (entries.length >= CAP) {
            let vi = 0;
            for (let i = 1; i < entries.length; i++) {
              if (POL === "lru" && entries[i].lastUsed < entries[vi].lastUsed) vi = i;
              else if (POL === "lfu" && (entries[i].freq < entries[vi].freq ||
                (entries[i].freq === entries[vi].freq && entries[i].lastUsed < entries[vi].lastUsed))) vi = i;
              else if (POL === "fifo" && entries[i].insertedAt < entries[vi].insertedAt) vi = i;
            }
            victim = entries[vi].key;
            evictions += 1;
            entries = entries.slice(0, vi).concat(entries.slice(vi + 1));
          }
          entries = entries.concat([{ key: key, lastUsed: t, freq: 1, insertedAt: t, expiresAt: TTL > 0 ? t + TTL : -1 }]);
          const hr = hits / (hits + misses);
          rate.push(hr);

          const herd = conc > 1
            ? ` ${conc} concurrent requests all missed the same key: ${conc} origin fetches naively, 1 with single-flight (${originNaive} vs ${originSF} so far).`
            : "";
          yield {
            label: `MISS on ${key} → fetch from origin, insert.${victim ? ` Evicted ${victim} (${POL === "lru" ? "least recently used" : POL === "lfu" ? "lowest frequency" : "oldest insertion"}).` : ""}${herd} Hit rate ${(hr * 100).toFixed(0)}%.`,
            phase: "miss",
            focus: [kid],
            state: base(t, { cur: key, result: "miss", victim: victim, conc: conc })
          };
        }
      }

      const hr = hits / Math.max(1, hits + misses);
      yield {
        label: `Final: ${hits} hits / ${misses} misses = ${(hr * 100).toFixed(1)}% hit rate with ${CAP} slots for ${K} keys. Origin saw ${originNaive} fetches; with single-flight it would have seen ${originSF} — a ${(originNaive / Math.max(1, originSF)).toFixed(1)}× reduction in database load for one lock.`,
        phase: "done",
        state: base(N, { cur: null, result: "done" })
      };
    },

    draw: function (frame, ctx, env) {
      const C = env.colors, W = env.width, H = env.height;
      const s = frame.state;
      ctx.clearRect(0, 0, W, H);

      const M = env.font.mono, F = env.font.base;
      const label = (x, y, t, col, size, align, mono) => {
        ctx.fillStyle = col; ctx.font = `${size || 11}px ${mono === false ? F : M}`;
        ctx.textAlign = align || "left"; ctx.fillText(t, x, y);
      };

      // ---- request stream (top strip) ----------------------------------------
      const sx = 16, sy = 30, tw = 30, th = 22;
      label(sx, sy - 10, "request stream (recent →)", C.muted, 10);
      for (let i = 0; i < s.stream.length; i++) {
        const r = s.stream[i];
        const x = sx + i * (tw + 4);
        const isCur = i === s.stream.length - 1;
        ctx.fillStyle = r.hit ? C.viz3 : C.viz2;
        ctx.globalAlpha = isCur ? 1 : 0.35 + 0.5 * (i / Math.max(1, s.stream.length));
        ctx.beginPath(); ctx.roundRect(x, sy, tw, th, 4); ctx.fill();
        ctx.globalAlpha = 1;
        label(x + tw / 2, sy + 15, r.key, C.text, 10, "center");
        if (isCur) {
          ctx.strokeStyle = C.text; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.roundRect(x - 1.5, sy - 1.5, tw + 3, th + 3, 5); ctx.stroke();
        }
      }

      // ---- cache slots --------------------------------------------------------
      const cy = sy + th + 34;
      const slotW = 76, slotH = 46;
      label(sx, cy - 8, `cache — ${s.entries.length}/${s.cap} slots (${s.policy.toUpperCase()})`, C.muted, 10);
      for (let i = 0; i < s.cap; i++) {
        const x = sx + i * (slotW + 8);
        const e = s.entries[i];
        ctx.fillStyle = C.surface2;
        ctx.beginPath(); ctx.roundRect(x, cy, slotW, slotH, 6); ctx.fill();
        ctx.strokeStyle = e && e.key === s.cur ? (s.result === "hit" ? C.viz3 : C.viz1) : C.border;
        ctx.lineWidth = e && e.key === s.cur ? 2 : 1;
        ctx.beginPath(); ctx.roundRect(x, cy, slotW, slotH, 6); ctx.stroke();
        if (e) {
          label(x + slotW / 2, cy + 20, e.key, C.text, 14, "center");
          const ttlTxt = s.ttl > 0 && e.expiresAt > 0 ? `ttl ${Math.max(0, e.expiresAt - s.t)}` : `freq ${e.freq}`;
          label(x + slotW / 2, cy + 36, ttlTxt, C.muted, 9, "center");
        } else {
          label(x + slotW / 2, cy + 27, "empty", C.muted, 10, "center");
        }
      }
      if (s.victim && s.result === "miss") {
        label(sx + s.cap * (slotW + 8) + 6, cy + 27, `evicted ${s.victim} ✕`, C.viz8, 11);
      }

      // ---- recency stack (MRU top) -------------------------------------------
      const stx = W - 132, sty = cy + slotH + 26;
      label(stx, sty - 8, s.policy === "lru" ? "recency stack (MRU→LRU)" : "recency (informational)", C.muted, 10);
      for (let i = 0; i < s.order.length; i++) {
        const y = sty + i * 20;
        const isCur = s.order[i] === s.cur;
        ctx.fillStyle = isCur ? C.viz1 : C.surface2;
        ctx.beginPath(); ctx.roundRect(stx, y, 96, 17, 3); ctx.fill();
        label(stx + 8, y + 12, s.order[i], isCur ? C.text : C.text2, 11);
        label(stx + 88, y + 12, i === 0 ? "MRU" : (i === s.order.length - 1 ? "LRU" : ""), C.muted, 8, "right");
      }

      // ---- hit-rate gauge -----------------------------------------------------
      const total = s.hits + s.misses;
      const hr = total ? s.hits / total : 0;
      const gx = sx + 62, gy = H - 78, gr = 42;
      ctx.lineWidth = 11;
      ctx.strokeStyle = C.surface2;
      ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.strokeStyle = hr > 0.85 ? C.ok : hr > 0.6 ? C.warn : C.danger;
      ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI, Math.PI + Math.PI * hr); ctx.stroke();
      label(gx, gy - 4, `${(hr * 100).toFixed(0)}%`, C.text, 20, "center");
      label(gx, gy + 12, "hit rate", C.muted, 10, "center");
      label(gx - gr, gy + 28, "0", C.muted, 9, "center");
      label(gx + gr, gy + 28, "100", C.muted, 9, "center");

      // ---- hit-rate history line ---------------------------------------------
      const lx = gx + gr + 34, lw = W - lx - 210, ly = H - 120, lh = 62;
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly + lh); ctx.lineTo(lx + lw, ly + lh); ctx.stroke();
      ctx.strokeStyle = C.grid;
      ctx.beginPath(); ctx.moveTo(lx, ly + lh / 2); ctx.lineTo(lx + lw, ly + lh / 2); ctx.stroke();
      label(lx - 4, ly + 6, "1.0", C.muted, 9, "right");
      label(lx - 4, ly + lh / 2 + 4, "0.5", C.muted, 9, "right");
      label(lx - 4, ly + lh + 3, "0", C.muted, 9, "right");
      label(lx + lw / 2, ly - 6, "cumulative hit rate over time", C.muted, 10, "center");
      if (s.rate.length > 1) {
        ctx.strokeStyle = C.viz3; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < s.rate.length; i++) {
          const x = lx + (i / Math.max(1, s.rate.length - 1)) * lw;
          const y = ly + lh - s.rate[i] * lh;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // ---- origin-load counters ----------------------------------------------
      const ox = lx + lw + 22, oy = ly + 6;
      label(ox, oy, "origin fetches", C.muted, 10);
      label(ox, oy + 20, `naive:        ${s.originNaive}`, C.danger, 12);
      label(ox, oy + 38, `single-flight: ${s.originSF}`, C.ok, 12);
      label(ox, oy + 58, `evictions ${s.evictions}   expired ${s.expired}`, C.muted, 10);
      if (s.conc > 1 && s.result === "miss") {
        label(ox, oy + 76, `⚡ herd: ${s.conc} concurrent misses`, C.warn, 11);
      }
    }
  },

  drill: {
    cards: [
      { q: "Give the rough latency ladder: in-process cache, Redis, SSD, DB query, cross-region.", a: "In-process ~0.1 µs, Redis over the network ~0.5–1 ms, SSD random read ~100 µs, an indexed DB query ~1–10 ms, cross-region round trip ~80–150 ms.", tags: ["numbers"] },
      { q: "At 95% hit rate, what does a cache do to database load?", a: "It divides it by 20 — only the 5% of misses reach the DB. The load-shedding effect usually matters more than the latency win, and it is why a cache outage is catastrophic: the DB suddenly sees 20× its normal traffic.", tags: ["numbers"] },
      { q: "LRU's catastrophic failure mode?", a: "A sequential scan. One analytics job walking the whole table touches every key once, evicting the entire working set with data nobody will read again. Scan-resistant policies (LFU, W-TinyLFU with an admission window) exist for exactly this.", tags: ["eviction"] },
      { q: "Cache-aside vs write-through vs write-behind.", a: "Cache-aside: app fills on miss — default, but cold-start misses. Write-through: write both together — never stale, slower writes, caches unread data. Write-behind: write cache, flush later — fastest, absorbs spikes, loses data if the cache dies first.", tags: ["strategies"] },
      { q: "On a write, do you update or delete the cache entry? Why?", a: "Delete. Concurrent writers can update the cache in the opposite order to their DB commits, leaving a permanently wrong value. Deletion is idempotent and forces the next read to repopulate from the source of truth.", tags: ["consistency", "pitfall"] },
      { q: "What is a cache stampede and what are the three fixes?", a: "A hot key expires and every concurrent request misses and hits the DB at once. Fixes: single-flight (one fetch, the rest await it), a per-key lease/mutex, or stale-while-revalidate (serve the expired value, refresh in the background).", tags: ["failure-modes"] },
      { q: "Cache penetration vs cache avalanche.", a: "Penetration: requests for keys that don't exist always miss and always hit the DB — fix with negative caching or a Bloom filter. Avalanche: many keys share an expiry time and all expire together — fix by jittering TTLs, e.g. ttl × (0.9 + 0.2·rand).", tags: ["failure-modes"] },
      { q: "Why is TTL not the same as invalidation?", a: "TTL is bounded staleness you have chosen to accept — a 60 s TTL means you agreed to serve data up to 60 s old. Real invalidation is event-driven: delete-on-write, CDC off the replication log, or versioned keys.", tags: ["invalidation"] }
    ],
    sixtySecond: [
      "Explain cache-aside, why you delete rather than update on writes, and what happens when a celebrity key expires.",
      "Explain LRU vs LFU, each one's failure mode, and what W-TinyLFU does about it."
    ]
  }
};
