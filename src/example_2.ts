import { JsonDB } from ".";

(async () => {
    type CounterData = { counter: number };
    const counterDB = new JsonDB<CounterData>(
        'example2_counter1.json',
        () => ({ counter: 0 })
    );
    await counterDB.init();

    let counter = 0;

    setInterval(async () => {
        await counterDB.query(cur => {
            counter = cur.counter;
        });
        counter++;

        counterDB.commit(cur => {
            cur.counter = counter;
        })
    }, 1000);
})();