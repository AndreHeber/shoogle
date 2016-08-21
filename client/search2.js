const {div, input, label, h2, button, makeDOMDriver} = CycleDOM;
const isolate = CycleIsolate;


function main(sources) {
    // const menuProps$ = Rx.Observable.of({
    //     width: 30,
    //     height: 20,
    //     inside: true
    // });

    const clicked$ = sources.DOM.select(".closeMenuButton").events("click");
    const toggle$ = clicked$.scan((toggle, x) => !toggle, false).startWith(null);
    const vtree$ = toggle$.map(state =>
        div(".menu", [
            label(".label", "State is " + state),
            button(".closeMenuButton", "Click Me!")
        ])
    );
    return {
        DOM: vtree$
    };
}

const drivers = {
    DOM: makeDOMDriver("#app")
};

Cycle.run(main, drivers);
