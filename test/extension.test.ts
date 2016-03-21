// 
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';
import { cmUtils } from '../src/cmUtils';

suite( "Line Parser Tests", () => {
    
    function extract( code: string, result: string ) {
        var line = cmUtils.getDottedCallsFromString( code, code.length );
        assert.equal( line, result );
    }
    
    test("SL - Stand Alone - No ;", () => {
        var code = `
        Something
        `;
        extract( code, "Something" );
    });
    
    test("SL - Property - No ;", () => {
        var code = `
        Something.foo
        `;
        extract( code, "Something.foo" );
    });
    
    test("SL - Method - No ;", () => {
        var code = `
        Something().foo
        `;
        extract( code, "Something.foo" );
    });
    
    test("SL - Multi Method - No ;", () => {
        var code = `
        Something().Awesome().foo
        `;
        extract( code, "Something.Awesome.foo" );
    });
    
    test("SL - Method - String Param - No ;", () => {
        var code = `
        Something("MY STRING").foo
        `;
        extract( code, "Something.foo" );
    });
    
    test("SL - Method - String Param w/ Terminators - No ;", () => {
        var code = `
        Something("What();").foo
        `;
        extract( code, "Something.foo" );
    });
    
    test("SL - Method - Code Param - No ;", () => {
        var code = `
        Something( 5 + 2 ).foo
        `;
        extract( code, "Something.foo" );
    });
    
    test("SL - Method - Method Param - No ;", () => {
        var code = `
        Something( Awesome() ).foo
        `;
        extract( code, "Something.foo" );
    });
    
    test("SL - Nested Method - No ;", () => {
        var code = `
        Something( Awesome().foo
        `;
        extract( code, "Awesome.foo" );
    });
    
    test("SL - LH Equation - No ;", () => {
        var code = `
        Something = foo().bar
        `;
        extract( code, "foo.bar" );
    });
    
    test("SL - LH Equation - Nested Method - No ;", () => {
        var code = `
        Something = foo( Awesome().bar
        `;
        extract( code, "Awesome.bar" );
    });
    
    test("SL - Inline If - No ;", () => {
        var code = `
        Something = true ? Awesome().bar
        `;
        extract( code, "Awesome.bar" );
    });
    
    test("ML - { Preceeding  - LH Equation - Nested Method - No ;", () => {
        var code = ` {
        Something = foo( Awesome().bar
        `;
        extract( code, "Awesome.bar" );
    });
    
    
} );