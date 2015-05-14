#include <nan.h>
#include <fstream>
#include "hive.h"

using namespace v8;

static uv_key_t isolate_cache_key;
static uv_key_t context_cache_key;
static uv_once_t key_guard;

static std::ifstream f("node_modules/babel-core/browser.js");
static std::string babel(
    (std::istreambuf_iterator<char>(f)), std::istreambuf_iterator<char>());

// Initialize libuv thread-local cache keys.
static void create_keys() {
  (void) uv_key_create(&isolate_cache_key);
  (void) uv_key_create(&context_cache_key);
}

// Returns an Isolate* from the thread-local cache, if it exists.
// Otherwise, creates and caches a new Isolate* before returning.
static Isolate* get_isolate() {
  Isolate* isolate = (Isolate *) uv_key_get(&isolate_cache_key);
  if (isolate == NULL) {
    isolate = Isolate::New();
    uv_key_set(&isolate_cache_key, isolate);
  }
  return isolate;
}

// Returns a Persistent<Context>* from the thread-local cache, if it exists.
// Otherwise, creates a new Persistent<Context>* in the given isolate, and
// evaluates the Babel bootstrap script to prepare the context for file
// transformation.
static Persistent<Context>* get_context(Isolate* isolate) {
  Persistent<Context>* context =
    (Persistent<Context> *) uv_key_get(&context_cache_key);

  if (context == NULL) {
    Local<Context> ctx = Context::New(isolate);
    context = new Persistent<Context>(isolate, ctx);

    Context::Scope context_scope(ctx);
    Local<Script> script = Script::Compile(
        String::NewFromUtf8(isolate, babel.c_str()));

    (void) script->Run();
    uv_key_set(&context_cache_key, context);
  }

  return context;
}

// Transforms the given file contents in a new v8 isolate on Node's default
// libuv thread pool, returning the result of the transformation on the main
// event loop.
class HiveWorker : public NanAsyncWorker {
 public:
  HiveWorker(NanCallback* callback, std::string path, std::string script)
    : NanAsyncWorker(callback), path(path), script(script) {}
  ~HiveWorker() {}

  // Executed inside the worker-thread.
  void Execute () {
    (void) uv_once(&key_guard, create_keys);
    Isolate* isolate = get_isolate();
    Isolate::Scope isolate_scope(isolate);

    NanLocker();
    NanScope();

    Persistent<Context>* context = get_context(isolate);
    Context::Scope context_scope(Local<Context>::New(isolate, *context));

    Local<Script> s = Script::Compile(NanNew<String>(script.c_str()));
    Local<Value> result = s->Run();

    res = result->IntegerValue();
    NanUnlocker();
  }

  // Executed when the async work is complete, inside the main thread.
  void HandleOKCallback () {
    NanScope();

    Local<Value> argv[] = {
        NanNull(),
        NanNew<Number>(res)
    };

    callback->Call(2, argv);
  }

 private:
  std::string path;
  std::string script;
  int64_t res;
};

NAN_METHOD(Take) {
  NanScope();

  String::Utf8Value p(args[0]->ToString());
  std::string path(*p);

  String::Utf8Value s(args[1]->ToString());
  std::string script(*s);

  NanCallback *callback = new NanCallback(args[2].As<Function>());
  NanAsyncQueueWorker(new HiveWorker(callback, path, script));
  NanReturnUndefined();
}
