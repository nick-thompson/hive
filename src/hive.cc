#include <nan.h>
#include "hive.h"

using namespace v8;

static uv_key_t isolate_cache_key;
static uv_key_t context_cache_key;
static uv_once_t key_guard;

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
// Otherwise, creates a new cached Persistent<Context>* in the given isolate.
static Persistent<Context>* get_context(Isolate* isolate) {
  Persistent<Context>* context =
    (Persistent<Context> *) uv_key_get(&context_cache_key);

  if (context == NULL) {
    Local<Context> ctx = Context::New(isolate);
    context = new Persistent<Context>(isolate, ctx);
    uv_key_set(&context_cache_key, context);
  }

  return context;
}

// Transforms the given file contents in a new v8 isolate on Node's default
// libuv thread pool, returning the result of the transformation on the main
// event loop.
class HiveWorker : public NanAsyncWorker {
 public:
  HiveWorker(NanCallback* callback, std::string script)
    : NanAsyncWorker(callback), script(script) {}
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

    TryCatch tc;
    Local<Script> s = Script::Compile(NanNew<String>(script.c_str()));
    Local<Value> v = s->Run();
    if (v.IsEmpty()) {
      Local<Value> ex = tc.Exception();
      String::Utf8Value ex_str(ex);
      SetErrorMessage(*ex_str);
      return;
    }

    // TODO: Should be a Local<Value> represented as a string via JSON stringify
    Local<String> result = v->ToString();

    String::Utf8Value r(result);

    res = std::string(*r);
    NanUnlocker();
  }

  // Executed when the async work is complete, inside the main thread.
  void HandleOKCallback () {
    NanScope();

    Local<Value> argv[] = {
        NanNull(),
        NanNew<String>(res.c_str())
    };

    callback->Call(2, argv);
  }

 private:
  std::string script;
  std::string res;
};

NAN_METHOD(Eval) {
  NanScope();

  String::Utf8Value s(args[0]->ToString());
  std::string script(*s);

  NanCallback *callback = new NanCallback(args[1].As<Function>());
  NanAsyncQueueWorker(new HiveWorker(callback, script));
  NanReturnUndefined();
}
