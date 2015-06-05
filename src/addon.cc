#include <nan.h>
#include "hive.h"

using namespace v8;

void Init(Handle<Object> exports) {
  exports->Set(NanNew<String>("eval"),
    NanNew<FunctionTemplate>(Eval)->GetFunction());
  exports->Set(NanNew<String>("init"),
    NanNew<FunctionTemplate>(Initialize)->GetFunction());
}

NODE_MODULE(addon, Init)
