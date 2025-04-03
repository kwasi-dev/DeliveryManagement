package com.zephirins.plugins.printer;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.IBinder;
import android.os.RemoteException;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import net.nyx.printerservice.print.IPrinterService;
import net.nyx.printerservice.print.PrintTextFormat;

@CapacitorPlugin(name = "NyxPrinter")
public class NyxPrinterPlugin extends Plugin {

    private IPrinterService printerService;

    private final ServiceConnection connService = new ServiceConnection() {
        public void onServiceConnected(ComponentName name, IBinder service) {
            printerService = IPrinterService.Stub.asInterface(service);
        }

        public void onServiceDisconnected(ComponentName name) {
            printerService = null;
        }
    };

    @Override
    public void load() {
        Intent intent = new Intent();
        intent.setPackage("com.incar.printerservice");
        intent.setAction("com.incar.printerservice.IPrinterService");
        getContext().bindService(intent, connService, Context.BIND_AUTO_CREATE);
    }

    @PluginMethod
    public void printText(PluginCall call) {
        String text = call.getString("text");

        if (printerService == null) {
            call.reject("Printer service not connected");
            return;
        }

        if (text == null || text.trim().isEmpty()) {
            call.reject("Missing 'text' parameter");
            return;
        }

        PrintTextFormat format = new PrintTextFormat(); // default format

        try {
            int result = printerService.printText(text, format);

            JSObject ret = new JSObject();
            ret.put("result", result);
            call.resolve(ret);
        } catch (RemoteException e) {
            call.reject("RemoteException while printing", e);
        }
    }

    @PluginMethod
        public void isReady(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("connected", printerService != null);
        call.resolve(ret);
    }
}
