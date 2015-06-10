#include <nan.h>
#include <vector>
#include <fstream>
#include "hive.h"

using namespace v8;

static uv_key_t isolate_cache_key;
static uv_key_t context_cache_key;
static uv_mutex_t mutex;

static std::vector<Isolate*> isolates(4);
static std::vector<Persistent<Context>*> contexts(4);

static int idx = 0;

static std::ifstream hive_file_("Hivefile.js");
static std::string hive_file(
    (std::istreambuf_iterator<char>(hive_file_)),
    std::istreambuf_iterator<char>());

// Estimates the size of the default libuv thread pool, based on
// the UV_THREADPOOL_SIZE environment variable.
static int get_threadpool_size() {
  int n = 4;
  const char* env = getenv("UV_THREADPOOL_SIZE");

  if (env != NULL)
    n = atoi(env);
  if (n == 0)
    n = 1;
  if (n > 128)
    n = 128;

  return n;
}

// Executes the given script or expression in a new v8 isolate on Node's default
// libuv thread pool, returning the result of the evaluation on the main
// event loop.
class HiveWorker : public NanAsyncWorker {
 public:
  HiveWorker(NanCallback* callback, std::string script)
    : NanAsyncWorker(callback), script(script), undef(false) {}
  ~HiveWorker() {}

  // Executed inside the worker-thread.
  void Execute () {
    Isolate* isolate = (Isolate *) uv_key_get(&isolate_cache_key);
    Persistent<Context>* context =
      (Persistent<Context> *) uv_key_get(&context_cache_key);

    // If thread local instances of the isolate and context are unavailable,
    // allocate a pair from the pool.
    if (isolate == NULL && context == NULL) {
      uv_mutex_lock(&mutex);
      isolate = isolates[idx];
      context = contexts[idx++];
      uv_key_set(&isolate_cache_key, isolate);
      uv_key_set(&context_cache_key, context);
      uv_mutex_unlock(&mutex);
    }

    Isolate::Scope isolate_scope(isolate);

    NanLocker();
    NanScope();

    Context::Scope context_scope(Local<Context>::New(isolate, *context));

    TryCatch user_try_catch;
    Local<Script> s = Script::Compile(NanNew<String>(script.c_str()));
    Local<Value> v = s->Run();

    if (v.IsEmpty()) {
      Local<Value> ex = user_try_catch.Exception();
      String::Utf8Value ex_str(ex);
      SetErrorMessage(*ex_str);
      NanUnlocker();
      return;
    }

    // Marshal the result of the script evaluation using JSON.stringify.
    TryCatch marshal_try_catch;
    Local<Object> global = NanGetCurrentContext()->Global();
    Local<Object> JSON = global->Get(NanNew<String>("JSON"))->ToObject();
    Local<Value> stringify_ = JSON->Get(NanNew<String>("stringify"));
    Local<Function> stringify = Local<Function>::Cast(stringify_);
    Local<Value> args[] = { v };
    Local<Value> result = stringify->Call(JSON, 1, args);

    if (result.IsEmpty()) {
      Local<Value> ex = marshal_try_catch.Exception();
      String::Utf8Value ex_str(ex);
      SetErrorMessage(*ex_str);
      NanUnlocker();
      return;
    }

    if (result->IsUndefined()) {
      // Per ECMAScript 5, JSON.stringify will return `undefined` given an
      // argument of type other than String, Boolean, Number, Object, or null,
      // or when given an argument of type Object which is callable
      // (a function).
      undef = true;
      NanUnlocker();
      return;
    }

    String::Utf8Value r(result);

    res = std::string(*r);
    NanUnlocker();
  }

  // Executed when the async work is complete, inside the main thread.
  void HandleOKCallback () {
    NanScope();

    if (undef) {
      Local<Value> argv[] = { NanNull(), NanUndefined() };
      callback->Call(2, argv);
      return;
    }

    Local<Value> argv[] = {
      NanNull(),
      NanNew<String>(res.c_str())
    };

    callback->Call(2, argv);
  }

 private:
  std::string script;
  std::string res;
  bool undef;
};

NAN_METHOD(Initialize) {
  int size = get_threadpool_size();
  isolates.resize(size);
  contexts.resize(size);

  for (int i = 0; i < size; i++) {
    Isolate* isolate = Isolate::New();
    Isolate::Scope isolate_scope(isolate);
    NanLocker();
    NanScope();

    Local<Context> ctx = Context::New(isolate);
    Persistent<Context>* context = new Persistent<Context>(isolate, ctx);
    if (!hive_file.empty()) {
      Context::Scope context_scope(ctx);
      Local<Script> s = Script::Compile(NanNew<String>(hive_file.c_str()));
      (void) s->Run();
    }
    isolates[i] = isolate;
    contexts[i] = context;

    NanUnlocker();
  }

  (void) uv_mutex_init(&mutex);
  (void) uv_key_create(&isolate_cache_key);
  (void) uv_key_create(&context_cache_key);
  NanReturnUndefined();
}

NAN_METHOD(Eval) {
  NanScope();

  String::Utf8Value s(args[0]->ToString());
  std::string script(*s);

  NanCallback *callback = new NanCallback(args[1].As<Function>());
  NanAsyncQueueWorker(new HiveWorker(callback, script));
  NanReturnUndefined();
}
