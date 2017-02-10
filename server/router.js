/**
 * Created by artem on 10/02/2017.
 */
function route(handle, pathname){
    if(typeof handle[pathname] === 'function') return handle[pathname]();
    else {
        console.log("No request handler found for " + pathname);
        return "404 Not found";
    }
}

exports.route = route;