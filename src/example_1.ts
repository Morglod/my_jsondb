import { JsonDB } from ".";

(async () => {
    const counterDB = new JsonDB(
        'example_counter.json',
        () => ({ counter: 0 })
    );
    await counterDB.init();

    setInterval(() => {
        counterDB.commit(cur => {
            cur.counter++;
        });
    }, 1000);
})();

(async () => {
    type CounterData = { counter: number };
    const counterDB = new JsonDB<CounterData>(
        'example_counter2.json',
        () => ({ counter: 0 })
    );
    await counterDB.init();

    let counter = 0;

    setInterval(() => {
        counter++;
        counterDB.commit(cur => {
            cur.counter = counter;
        });
    }, 1000);
})();