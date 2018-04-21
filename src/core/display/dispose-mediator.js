export default disposable => {
    if (disposable) {
        disposable.dispose();
        disposable.node = null;
    }
};