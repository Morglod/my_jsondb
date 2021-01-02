# @morglod/jsondb

Super simple file db for cli tools / utils.  
It syncs changes from fs & changes from program.

```
npm i @morglod/jsondb
```

```ts
const counterDB = new JsonDB(
    // path
    'example_counter.json',

    // initial data
    () => ({ counter: 0 })
);

await counterDB.init();

setInterval(() => {
    counterDB.commit(cur => {
        cur.counter++;
    });
}, 1000);
```

## After external update hook

```ts
jsobDB.afterRead.push(currentData => {
    // ....
})
```