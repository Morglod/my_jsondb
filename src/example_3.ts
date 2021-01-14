import { JsonDB } from ".";

(async () => {
    const counterDB = new JsonDB(
        'example3_big.json',
        () => ({
            items: Array.from({ length: 500 }).map(x => ({
                name: `${Math.random()}`,
                a: 123,
                c: Date.now(),
                g: `eqweqweqwnjkzvjkjanfsnjasdsnjdjnlksadjnasdnjlksadlnjnsajdnjklsadjnsadjnnljasd${Math.random()}`
            }))
        })
    );
    await counterDB.init();

    let counter = 0;

    setInterval(async () => {
        await counterDB.query(cur => {
            counter = cur.items.length;
        });
        counter++;

        counterDB.commit(cur => {
            // qweqwe
        })
    }, 1000);
})();